import { Request, Response, NextFunction } from "express";
import { logger } from "server/utils/logger";

const formatSize = (header: string | undefined): string => {
  if (header === undefined) {
    return "-";
  }
  const bytes = Number(header);
  if (!Number.isFinite(bytes)) {
    return header;
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

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
    const size = formatSize(res.get("Content-Length"));
    logger.info(
      `API call: ${req.method} ${req.path} ${res.statusCode} ${ms}ms user=${user} ip=${ip} size=${size}`,
    );
  });
  next();
};
