import http, { Server } from "node:http";
import path from "node:path";
import { once } from "node:events";
import express, { Request, Response, NextFunction } from "express";
import { setupExpressErrorHandler } from "@sentry/node";
import helmet from "helmet";
import morgan from "morgan";
import expressStaticGzip from "express-static-gzip";
import { config } from "shared/config";
import { logger, accessLogStream } from "server/utils/logger";
import { allowCORS } from "server/middleware/cors";
import "server/db/mongoosePlugins"; // Must be imported before apiRoutes which loads models
import { apiRoutes } from "server/api/apiRoutes";
import { db } from "server/db/mongodb";
import { stopCronJobs } from "server/utils/cron";
import { wwwRedirect } from "server/middleware/wwwRedirect";
import { sentryRoutes } from "server/api/sentryRoutes";

interface StartServerParams {
  dbConnString: string;
  port?: number;
  dbName?: string;
}
export const startServer = async ({
  dbConnString,
  port,
  dbName,
}: StartServerParams): Promise<Server> => {
  try {
    await db.connectToDb(dbConnString, dbName);
  } catch (error) {
    logger.error("%s", error);
  }

  const app = express();

  const cspConnectSrc = [
    "'self'",
    "*.sentry.io",
    ...config.server().allowedCorsOrigins,
  ];

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          "connect-src": cspConnectSrc,
          // Don't upgrade http to https when running CI playwright tests
          ...(process.env.SETTINGS === "ci" && {
            upgradeInsecureRequests: null,
          }),
        },
      },
    }),
  );

  if (config.server().enableAccessLog) {
    // Set logger
    logger.info("Express: Overriding 'Express' logger");
    app.use(morgan("dev", { stream: accessLogStream }));
  }

  if (process.env.NODE_ENV === "development") {
    // Kompassi mock service requires content type application/x-www-form-urlencoded
    app.use(express.urlencoded({ extended: true }));
  }

  // Accepts raw body
  app.use(sentryRoutes);

  // Parse body and populate req.body - only accepts JSON
  app.use(express.json({ limit: "1000kb", type: "*/*" })); // limit: 1MB

  app.use(
    "/",
    (err: Error, _req: Request, res: Response, next: NextFunction) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (err) {
        logger.warn(`Invalid request: ${JSON.stringify(err)}`);
        return res.sendStatus(400);
      }
      next();
    },
  );

  app.use(allowCORS);
  app.use(wwwRedirect);

  app.use(apiRoutes);

  // Set static path
  const staticPath = path.join(__dirname, "../../", "front");

  if (!config.server().onlyCronjobs) {
    // Set compression
    if (config.server().bundleCompression) {
      app.use(
        expressStaticGzip(staticPath, {
          enableBrotli: true,
          orderPreference: ["br", "gz"],
        }),
      );
    } else {
      app.use(express.static(staticPath));
    }
  }

  app.get("/*", (req: Request, res: Response) => {
    if (req.originalUrl.includes("/api/")) {
      res.sendStatus(404);
    } else {
      if (!config.server().onlyCronjobs) {
        res.sendFile(path.join(staticPath, "index.html"));
      }
    }
  });

  // Error handler
  app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
    // Delegate to the default Express error handler, when the headers have already been sent to the client
    // For example, if error is encountered while streaming the response to the client
    // Express default error handler closes the connection and fails the request
    // https://expressjs.com/en/guide/error-handling.html
    if (res.headersSent) {
      next(err);
      return;
    }
    logger.error("%s", err);
    return res.sendStatus(500);
  });

  // Sentry setup: add this after all routes and other middlewares are defined
  setupExpressErrorHandler(app);

  const server = http.createServer(app);

  const runningServer = server.listen(port ?? process.env.PORT);

  try {
    await once(runningServer, "listening");
  } catch (error) {
    logger.warn("Starting server failed, shutting down...");
    await closeServer(server);
    // eslint-disable-next-line no-restricted-syntax -- Server startup
    throw error;
  }

  const address = runningServer.address();
  if (!address || typeof address === "string") {
    // eslint-disable-next-line no-restricted-syntax -- Server startup
    throw new Error("Unable to get address");
  }

  logger.info(`Express: Server started on port ${address.port}`);

  return runningServer;
};

export const closeServer = async (
  server: Server,
  signal?: string,
): Promise<void> => {
  logger.info(`Received signal to terminate: ${signal}`);
  if (config.server().onlyCronjobs) {
    stopCronJobs();
  }
  server.close();
  logger.info("Server closed");

  try {
    await db.gracefulExit();
  } catch (error) {
    logger.error("%s", error);
  }

  logger.info("Shutdown completed, bye");
};
