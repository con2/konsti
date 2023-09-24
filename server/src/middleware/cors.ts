import { Request, Response, NextFunction } from "express";
import { logger } from "server/utils/logger";
import { config } from "server/config";

export const allowCORS = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const allowedOrigins = config.allowedCorsOrigins;
  const origin = req.headers.origin;

  // Same origin, no preflight CORS request
  if (!origin) {
    next();
    return;
  }

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, Baggage, Sentry-Trace",
    );
    next();
    return;
  }

  logger.error("%s", new Error(`CORS: Request blocked from ${origin}`));
  next();
};
