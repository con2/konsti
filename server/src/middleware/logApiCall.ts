import { Request, Response, NextFunction } from "express";
import { logger } from "server/utils/logger";

export const logApiCall = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    logger.info(
      `API call: ${req.method} ${req.path} ${res.statusCode} ${ms}ms`,
    );
  });
  next();
};
