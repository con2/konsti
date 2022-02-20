import http, { Server } from "http";
import https from "https";
import path from "path";
import fs from "fs";
import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import morgan from "morgan";
import expressStaticGzip from "express-static-gzip";
import { config } from "server/config";
import { logger, stream } from "server/utils/logger";
import { allowCORS } from "server/middleware/cors";
import "server/db/mongoosePlugins"; // Must be imported before apiRoutes which loads models
import { apiRoutes } from "server/api/apiRoutes";
import { db } from "server/db/mongodb";

export const startServer = async (
  dbConnString: string,
  port?: number
): Promise<Server> => {
  try {
    await db.connectToDb(dbConnString);
  } catch (error) {
    logger.error(error);
  }

  const app = express();

  app.use(helmet());

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

  app.get("/*", (_req: Request, res: Response) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

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
  try {
    await server.close();
  } catch (error) {
    logger.error(error);
  }

  try {
    await db.gracefulExit();
  } catch (error) {
    logger.error(error);
  }

  logger.info("Server closed");
};
