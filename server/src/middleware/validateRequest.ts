import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { logger } from "server/utils/logger";

export const validateBody =
  (schema: z.ZodType) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      logger.error(
        "%s",
        new Error(
          `Error validating ${req.method} ${req.path} body: ${JSON.stringify(result.error)}`,
        ),
      );
      res.sendStatus(422);
      return;
    }
    req.body = result.data;
    next();
  };

export const validateQuery =
  (schema: z.ZodType) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      logger.error(
        "%s",
        new Error(
          `Error validating ${req.method} ${req.path} query: ${JSON.stringify(result.error)}`,
        ),
      );
      res.sendStatus(422);
      return;
    }
    // Express 5 makes req.query a getter, so direct assignment is unsafe;
    // defineProperty replaces it with the parsed value
    Object.defineProperty(req, "query", {
      value: result.data,
      writable: true,
      configurable: true,
    });
    next();
  };
