import { NextFunction, Request, Response } from "express";
import { UserGroup } from "shared/types/models/user";
import { getAuthorizedUser } from "server/utils/authHeader";

declare module "express-serve-static-core" {
  interface Request {
    auth?: { userId: string; username: string };
  }
}

export const requireAuth =
  (allowedGroups: UserGroup | UserGroup[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const authorizedUser = getAuthorizedUser(
      req.headers.authorization,
      allowedGroups,
    );
    if (!authorizedUser) {
      res.sendStatus(401);
      return;
    }
    req.auth = authorizedUser;
    next();
  };

export const getAuthUsername = (req: {
  auth?: { username: string };
}): string => {
  if (!req.auth) {
    // eslint-disable-next-line no-restricted-syntax -- programming error if requireAuth was not wired
    throw new Error(
      "requireAuth middleware did not run before this handler - wire requireAuth() in apiRoutes",
    );
  }
  return req.auth.username;
};
