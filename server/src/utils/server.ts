import { once } from "node:events";
import http, { Server, ServerResponse } from "node:http";
import path from "node:path";
import { flush, setupExpressErrorHandler } from "@sentry/node";
import express, { NextFunction, Request, Response } from "express";
import expressStaticGzip from "express-static-gzip";
import helmet from "helmet";
import { config } from "shared/config";
import { apiRoutes } from "server/api/apiRoutes";
import { sentryRoutes } from "server/api/sentryRoutes";
import { db } from "server/db/mongodb";
import { allowCORS } from "server/middleware/cors";
import { wwwRedirect } from "server/middleware/wwwRedirect";
import { stopCronJobs } from "server/utils/cron";
import { logger } from "server/utils/logger";

interface StartServerParams {
  dbConnString: string;
  port?: number;
  dbName?: string;
  // Overridable so a test can serve a directory of its own instead of the
  // build output, which other suites running in parallel also read
  staticFilesPath?: string;
}
export const startServer = async ({
  dbConnString,
  port,
  dbName,
  staticFilesPath,
}: StartServerParams): Promise<Server> => {
  await db.connectToDb(dbConnString, dbName);

  const app = express();

  // Trust one hop of reverse proxy (k8s ingress / load balancer) so req.ip reads
  // X-Forwarded-For instead of the proxy's address. Harmless in dev.
  app.set("trust proxy", 1);

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

  if (process.env.NODE_ENV === "development") {
    // Kompassi mock service requires content type application/x-www-form-urlencoded
    app.use(express.urlencoded({ extended: true }));
  }

  // Accepts raw body
  app.use(sentryRoutes);

  // Parse body and populate req.body - only accepts JSON
  app.use(express.json({ limit: "1000kb", type: "*/*" })); // limit: 1MB

  app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
    if ("status" in err && err.status === 400) {
      logger.warn(`Invalid request: ${err.message}`);
      return res.sendStatus(400);
    }
    next(err);
  });

  app.use("/api", allowCORS);
  app.use("/auth", allowCORS);
  app.use(wwwRedirect);

  app.use(apiRoutes);

  // Set static path
  const staticPath =
    staticFilesPath ?? path.join(import.meta.dirname, "../../", "front");

  // The bundler emits every file it builds into assets/ with a content hash
  // in the name, while static files are copied from the client's public
  // directory to the served root. A path under assets/ is therefore exactly
  // the set of files whose name changes with their content, which is what
  // makes them safe to cache forever. Deciding by directory rather than by
  // the shape of the filename matters because names alone are ambiguous:
  // an ordinary hyphenated name (service-worker-registration.js) is
  // indistinguishable from a hashed one. Everything else revalidates,
  // index.html above all - it decides which hashed files are requested.
  // Split on both separators because the path comes from the serving
  // library and may use either style
  const setStaticCacheHeaders = (
    res: ServerResponse,
    filePath: string,
  ): void => {
    // Relative to the served root: the absolute path can carry an "assets"
    // directory of its own above it, which would cache index.html forever
    const isBundledAsset = path
      .relative(staticPath, filePath)
      .split(/[\\/]/)
      .includes("assets");
    res.setHeader(
      "Cache-Control",
      isBundledAsset ? "public, max-age=31536000, immutable" : "no-cache",
    );
  };

  const serveIndexAndApi =
    !config.server().onlyCronjobs ||
    config.server().cronjobsAndBackendSameInstance;

  if (serveIndexAndApi) {
    // Set compression
    if (config.server().bundleCompression) {
      app.use(
        expressStaticGzip(staticPath, {
          enableBrotli: true,
          orderPreference: ["br", "gz"],
          serveStatic: {
            acceptRanges: false,
            setHeaders: setStaticCacheHeaders,
          },
        }),
      );
    } else {
      app.use(
        express.static(staticPath, {
          acceptRanges: false,
          setHeaders: setStaticCacheHeaders,
        }),
      );
    }
  }

  app.get("/*splat", (req: Request, res: Response) => {
    // A dotted path segment is a file request the static middleware already
    // failed to match, so the file doesn't exist. App routes never contain dots.
    const looksLikeFile = req.path
      .split("/")
      .some((segment) => segment.includes("."));

    if (
      req.originalUrl.includes("/api/") ||
      looksLikeFile ||
      !serveIndexAndApi
    ) {
      res.sendStatus(404);
      return;
    }

    res.sendFile(path.join(staticPath, "index.html"), {
      headers: { "Cache-Control": "no-cache" },
    });
  });

  // Sentry setup: add this after all routes and before other error-handling middlewares
  setupExpressErrorHandler(app);

  // Error handler
  app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
    // Delegate to the default Express error handler, when the headers have already been sent to the client
    // For example, if error is encountered while streaming the response to the client
    // Express default error handler closes the connection and fails the request
    // https://expressjs.com/en/guide/error-handling.html
    if (res.headersSent) {
      logger.error(new Error("Error after headers sent", { cause: err }));
      next(err);
      return;
    }
    logger.error(err);
    return res.sendStatus(500);
  });

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
  logger.info(`Received signal to terminate${signal ? `: ${signal}` : ""}`);

  const enableCronjobs =
    config.server().onlyCronjobs ||
    config.server().cronjobsAndBackendSameInstance;

  if (enableCronjobs) {
    stopCronJobs();
  }
  server.close();
  logger.info("Server closed");

  try {
    await db.gracefulExit();
  } catch (error) {
    logger.error(error);
  }

  // Send buffered Sentry events before the process exits. The timeout leaves
  // room for the transport's short first retry; an event already in the long
  // second retry is abandoned rather than risking the k8s termination grace
  // period. No-op when Sentry is not initialized (tests, local dev)
  await flush(5000);

  logger.info("Shutdown completed, bye");
};
