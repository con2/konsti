import { Request, Response, NextFunction } from "express";
import { logger } from "server/utils/logger";

export const logApiCall = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (req.method === "OPTIONS") {
    next();
    return;
  }

  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    const user = req.auth?.username ?? "anon";
    const ip = req.ip?.replace(/^::ffff:/, "") ?? "-";
    const size = res.get("Content-Length") ?? "-";
    logger.info(
      `API call: ${req.method} ${req.path} ${res.statusCode} ${ms}ms user=${user} ip=${ip} size=${size}`,
    );
  });
  next();
};
