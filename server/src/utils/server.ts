import http, { Server } from "http";
import https from "https";
import path from "path";
import fs from "fs";
import express, { Request, Response, NextFunction } from "express";
import { Handlers } from "@sentry/node";
import helmet from "helmet";
import morgan from "morgan";
import expressStaticGzip from "express-static-gzip";
import { config } from "server/config";
import { logger, stream } from "server/utils/logger";
import { allowCORS } from "server/middleware/cors";
import "server/db/mongoosePlugins"; // Must be imported before apiRoutes which loads models
import { apiRoutes } from "server/api/apiRoutes";
import { db } from "server/db/mongodb";
import { stopCronJobs } from "server/utils/cron";
import { wwwRedirect } from "server/middleware/wwwRedirect";
import { initSentry } from "server/utils/sentry";

interface StartServerParams {
  dbConnString: string;
  port?: number;
  dbName?: string;
  enableSentry?: boolean;
}
export const startServer = async ({
  dbConnString,
  port,
  dbName,
  enableSentry = true,
}: StartServerParams): Promise<Server> => {
  try {
    await db.connectToDb(dbConnString, dbName);
  } catch (error) {
    logger.error(error);
  }

  const app = express();

  // Must be the first middleware on the app
  initSentry(app, enableSentry);

  app.use(helmet());

  if (config.enableAccessLog) {
    // Set logger
    logger.info("Express: Overriding 'Express' logger");
    app.use(morgan("dev", { stream }));
  }

  // Parse body and populate req.body - only accepts JSON
  app.use(express.json({ limit: "1000kb", type: "*/*" })); // limit: 1MB

  app.use(
    "/",
    (err: Error, _req: Request, res: Response, next: NextFunction) => {
      if (err) {
        logger.warn(`Invalid request: ${JSON.stringify(err)}`);
        return res.sendStatus(400);
      } else {
        next();
      }
    }
  );

  app.use(allowCORS);
  app.use(wwwRedirect);

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
  app.use(Handlers.errorHandler());

  let server: Server;

  // Use https for running Playwright tests in CI
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
    // eslint-disable-next-line no-restricted-syntax -- Server startup
    throw new Error("Starting server failed");

  logger.info(`Express: Server started on port ${address.port}`);

  return runningServer;
};

export const closeServer = async (
  server: Server,
  signal?: string
): Promise<void> => {
  logger.info(`Received signal to terminate: ${signal}`);
  stopCronJobs();
  server.close();
  logger.info("Server closed");

  try {
    await db.gracefulExit();
  } catch (error) {
    logger.error(error);
  }

  logger.info("Shutdown completed, bye");
};
