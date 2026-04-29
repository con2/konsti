import { Request, Response, NextFunction } from "express";
import { getAuthorizedUsername } from "server/utils/authHeader";
import { UserGroup } from "shared/types/models/user";

declare module "express-serve-static-core" {
  interface Request {
    auth?: { username: string };
  }
}

export const requireAuth =
  (allowedGroups: UserGroup | UserGroup[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const username = getAuthorizedUsername(
      req.headers.authorization,
      allowedGroups,
    );
    if (!username) {
      res.sendStatus(401);
      return;
    }
    req.auth = { username };
    next();
  };

export const getAuthUsername = (req: {
  auth?: { username: string };
}): string => {
  if (!req.auth) {
    // eslint-disable-next-line no-restricted-syntax -- programming error if requireAuth was not wired
    throw new Error(
      "requireAuth middleware did not run before this handler — wire requireAuth() in apiRoutes",
    );
  }
  return req.auth.username;
};
