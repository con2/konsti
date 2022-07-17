import http, { Server } from "http";
import https from "https";
import path from "path";
import fs from "fs";
import express, { Request, Response, NextFunction } from "express";
import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";
import helmet from "helmet";
import morgan from "morgan";
import expressStaticGzip from "express-static-gzip";
import { config } from "server/config";
import { logger, stream } from "server/utils/logger";
import { allowCORS } from "server/middleware/cors";
import "server/db/mongoosePlugins"; // Must be imported before apiRoutes which loads models
import { apiRoutes } from "server/api/apiRoutes";
import { db } from "server/db/mongodb";

interface StartServerParams {
  dbConnString: string;
  port?: number;
  enableSentry?: boolean;
}
export const startServer = async ({
  dbConnString,
  port,
  enableSentry = true,
}: StartServerParams): Promise<Server> => {
  try {
    await db.connectToDb(dbConnString);
  } catch (error) {
    logger.error(error);
  }

  const app = express();

  const getDsn = (): string => {
    if (!enableSentry) return "";
    switch (process.env.SETTINGS) {
      case "production":
        return "https://0278d6bfb3f04c70acf826ecbd86ae58@o1321706.ingest.sentry.io/6579204";
      case "staging":
        return "https://ab176c60aac24be8af2f6c790f1437ac@o1321706.ingest.sentry.io/6578390";
      default:
        return "";
    }
  };

  Sentry.init({
    dsn: getDsn(),
    integrations: [
      // Enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // Enable Express.js middleware tracing
      new Tracing.Integrations.Express({
        // To trace all requests to the default router
        app,
      }),
    ],
    tracesSampleRate: 0.2,
  });

  // The request handler must be the first middleware on the app
  // RequestHandler creates a separate execution context using domains, so that every
  // transaction/span/breadcrumb is attached to its own Hub instance
  app.use(Sentry.Handlers.requestHandler());

  // TracingHandler creates a trace for every incoming request
  app.use(Sentry.Handlers.tracingHandler());

  app.use(helmet());

  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        "connect-src": ["'self'", "*.sentry.io"],
      },
    })
  );

  if (config.enableAccessLog) {
    // Set logger
    logger.info("Express: Overriding 'Express' logger");
    app.use(morgan("dev", { stream }));
  }

  // Parse body and populate req.body - only accepts JSON
  app.use(express.json({ limit: "1000kb", type: "*/*" }));

  app.use(
    "/",
    (err: Error, _req: Request, res: Response, next: NextFunction) => {
      if (err) {
        return res.sendStatus(400);
      } else {
        return next();
      }
    }
  );

  app.use(allowCORS);

  app.use(apiRoutes);

  // Set static path
  const staticPath = path.join(__dirname, "../../", "front");

  // Set compression
  if (config.bundleCompression) {
    app.use(
      expressStaticGzip(staticPath, {
        enableBrotli: true,
        orderPreference: ["br", "gz"],
      })
    );
  } else {
    app.use(express.static(staticPath));
  }

  app.get("/*", (req: Request, res: Response) => {
    if (req.originalUrl.includes("/api/")) {
      res.sendStatus(404);
    } else {
      res.sendFile(path.join(staticPath, "index.html"));
    }
  });

  // The error handler must be before any other error middleware and after all controllers
  app.use(Sentry.Handlers.errorHandler());

  let server: Server;

  // Use https for running tests in CI
  if (process.env.SETTINGS === "CI") {
    const privateKey = fs.readFileSync(
      path.join(__dirname, "../../dev-cert", "server.key"),
      "utf8"
    );
    const certificate = fs.readFileSync(
      path.join(__dirname, "../../dev-cert", "server.cert"),
      "utf8"
    );

    server = https.createServer({ key: privateKey, cert: certificate }, app);
  } else {
    server = http.createServer(app);
  }

  const runningServer = server.listen(port ?? process.env.PORT);

  const address = runningServer.address();
  if (!address || typeof address === "string")
    throw new Error("Starting server failed");

  logger.info(`Express: Server started on port ${address.port}`);

  return runningServer;
};

export const closeServer = async (server: Server): Promise<void> => {
  server.close();

  try {
    await db.gracefulExit();
  } catch (error) {
    logger.error(error);
  }

  logger.info("Server closed");
};
