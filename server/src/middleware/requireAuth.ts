import { NextFunction, Request, Response } from "express";
import { UserGroup } from "shared/types/models/user";
import { getAuthorizedUserId } from "server/utils/authHeader";

declare module "express-serve-static-core" {
  interface Request {
    auth?: { userId: string };
  }
}

export const requireAuth =
  (allowedGroups: UserGroup | UserGroup[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const userId = getAuthorizedUserId(
      req.headers.authorization,
      allowedGroups,
    );
    if (!userId) {
      res.sendStatus(401);
      return;
    }
    req.auth = { userId };
    next();
  };

export const getAuthUserId = (req: { auth?: { userId: string } }): string => {
  if (!req.auth) {
    // eslint-disable-next-line no-restricted-syntax -- programming error if requireAuth was not wired
    throw new Error(
      "requireAuth middleware did not run before this handler - wire requireAuth() in apiRoutes",
    );
  }
  return req.auth.userId;
};
