import { logger } from 'utils/logger';
import { config } from 'config';
import { Request, Response, NextFunction } from 'express';

export const allowCORS = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const allowedOrigins = config.allowedCorsOrigins;
  const origin = req.headers.origin;

  if (origin && !Array.isArray(origin) && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization'
    );
  } else if (!origin) {
    // logger.info(`CORS: Same origin`)
  } else {
    logger.info(`CORS: Block from ${origin}`);
  }

  return next();
};
