import { Request, Response, NextFunction } from "express";
import { logger } from "server/utils/logger";

export const wwwRedirect = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const host = req.get("host");
  if (!host) {
    return;
  }

  const hostHasWww = /^www\./.test(host);

  if (hostHasWww) {
    logger.info(`Redirect WWW to non-WWW host`);

    const protocol = req.protocol;
    const hostWithoutWww = host.replace(/^www\./, "");

    return res.redirect(301, `${protocol}://${hostWithoutWww}${req.url}`);
  }

  next();
};
