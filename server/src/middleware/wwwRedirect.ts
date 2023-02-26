import { Request, Response, NextFunction } from "express";
import { logger } from "server/utils/logger";

export const wwwRedirect = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const host = req.get("host");
  const isHttp = req.protocol === "http";

  // Skip redirect with http connection because App Runner automatically redirects to https and second redirect will return error
  if (!host || isHttp) {
    next();
    return; // Not actually reached but required by TS
  }

  const hostHasWww = /^www\./.test(host);

  if (hostHasWww) {
    logger.info(`Redirect WWW to non-WWW host`);

    const protocol = req.protocol;
    const hostWithoutWww = host.replace(/^www\./, "");

    res.redirect(301, `${protocol}://${hostWithoutWww}${req.url}`);
  }

  next();
};
