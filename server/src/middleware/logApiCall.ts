import { Request, Response, NextFunction } from "express";
import { logger } from "server/utils/logger";

export const logApiCall = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  logger.info(`API call: ${req.method} ${req.path}`);
  next();
};
