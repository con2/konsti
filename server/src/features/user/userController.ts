import { Request, Response } from "express";
import {
  fetchUserByUsername,
  storeUser,
  fetchUserBySerialOrUsername,
  storeUserPassword,
} from "server/features/user/userService";
import { getAuthUsername } from "server/middleware/requireAuth";
import { getAuthorizedUserGroup } from "server/utils/authHeader";
import { logger } from "server/utils/logger";
import { UserGroup } from "shared/types/models/user";
import {
  GetUserBySerialRequest,
  PostUpdateUserPasswordRequest,
  PostUserRequest,
} from "shared/types/api/users";
import { PostUpdateUserEmailAddressRequestSchema } from "shared/types/api/login";
import { verifyUpdateUserEmailAddress } from "server/features/kompassi-login/kompassiLoginService";

export const postUser = async (
  req: Request<unknown, unknown, PostUserRequest>,
  res: Response,
): Promise<Response> => {
  const { username, password, serial } = req.body;
  const response = await storeUser(username, password, serial);
  return res.json(response);
};

export const postUserPassword = async (
  req: Request<unknown, unknown, PostUpdateUserPasswordRequest>,
  res: Response,
): Promise<Response> => {
  const requesterUsername = getAuthUsername(req);
  const requesterUserGroup = getAuthorizedUserGroup(req.headers.authorization);
  const { usernameToUpdate, password } = req.body;

  // Only the account owner, helpers, or admins may change a password — decided by the JWT
  // userGroup claim, never by the requester's username
  const isAdminOrHelper =
    requesterUserGroup === UserGroup.ADMIN ||
    requesterUserGroup === UserGroup.HELPER;

  if (requesterUsername !== usernameToUpdate && !isAdminOrHelper) {
    return res.sendStatus(401);
  }

  const response = await storeUserPassword(
    usernameToUpdate,
    password,
    requesterUserGroup,
  );
  return res.json(response);
};

export const getUser = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const response = await fetchUserByUsername(getAuthUsername(req));
  return res.json(response);
};

export const getUserBySerialOrUsername = async (
  req: Request<unknown, unknown, unknown, GetUserBySerialRequest>,
  res: Response,
): Promise<Response> => {
  const { searchTerm } = req.query;

  if (!searchTerm) {
    return res.sendStatus(422);
  }

  const response = await fetchUserBySerialOrUsername(searchTerm);

  return res.json(response);
};

export const postUpdateUserEmailAddress = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const result = PostUpdateUserEmailAddressRequestSchema.safeParse(req.body);
  if (!result.success) {
    logger.error(
      new Error(`Error validating postUpdateUserEmailAddress body`, {
        cause: result.error,
      }),
    );
    return res.status(422).json({
      message: "Invalid email format",
      status: "error",
      errorId: "invalidEmail",
    });
  }

  const { email } = result.data;
  const response = await verifyUpdateUserEmailAddress(
    getAuthUsername(req),
    email,
  );
  return res.json(response);
};
