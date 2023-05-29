import { logger } from "server/utils/logger";
import { UserModel } from "server/features/user/userSchema";
import { NewUser } from "server/typings/user.typings";
import { Serial } from "server/typings/serial.typings";
import { User, UserGroup } from "shared/typings/models/user";
import {
  AsyncResult,
  makeErrorResult,
  makeSuccessResult,
} from "shared/utils/asyncResult";
import { MongoDbError } from "shared/typings/api/errors";

export const removeUsers = async (): Promise<void> => {
  logger.info("MongoDB: remove ALL users from db");
  try {
    await UserModel.deleteMany({});
  } catch (error) {
    throw new Error(`MongoDB: Error removing users: ${error}`);
  }
};

export const saveUser = async (newUserData: NewUser): Promise<User> => {
  const user = new UserModel({
    username: newUserData.username,
    password: newUserData.passwordHash,
    userGroup: newUserData.userGroup ? newUserData.userGroup : UserGroup.USER,
    serial: newUserData.serial,
    groupCode:
      typeof newUserData.groupCode === "string" ? newUserData.groupCode : "0",
    favoritedGames: [],
    signedGames: [],
  });

  let response;
  try {
    response = await user.save();
    logger.debug(`MongoDB: User "${newUserData.username}" saved to DB`);
    return response;
  } catch (error) {
    logger.error(
      `MongoDB: Error creating new user ${newUserData.username} - ${error}`
    );
    throw error;
  }
};

export const updateUserByUsername = async (user: User): Promise<User> => {
  let response;

  try {
    response = await UserModel.findOneAndUpdate(
      { username: user.username },
      {
        userGroup: user.userGroup,
        serial: user.serial,
        groupCode: user.groupCode,
        favoritedGames: user.favoritedGames,
        signedGames: user.signedGames,
      },
      { new: true, fields: "-_id -__v -createdAt -updatedAt" }
    )
      .lean<User>()
      .populate("favoritedGames")
      .populate("signedGames.gameDetails");
  } catch (error) {
    logger.error(`MongoDB: Error updating user ${user.username} - ${error}`);
    throw error;
  }

  if (!response) {
    const error = `MongoDB: Error updating user ${user.username}: user not found`;
    logger.error(error);
    throw new Error(error);
  }

  logger.debug(`MongoDB: User "${user.username}" updated`);
  return response;
};

export const updateUserPassword = async (
  username: string,
  password: string
): Promise<User | null> => {
  let response;

  try {
    response = await UserModel.findOneAndUpdate(
      { username },
      {
        password,
      },
      { new: true, fields: "-_id -__v -createdAt -updatedAt" }
    )
      .lean<User>()
      .populate("favoritedGames")
      .populate("signedGames.gameDetails");

    logger.debug(`MongoDB: Password for user "${username}" updated`);

    return response;
  } catch (error) {
    logger.error(
      `MongoDB: Error updating password for user ${username} - ${error}`
    );
    throw error;
  }
};

export const findUser = async (
  username: string
): Promise<AsyncResult<User | null, MongoDbError>> => {
  try {
    const response = await UserModel.findOne({ username }, "-signedGames._id")
      .lean<User>()
      .populate("favoritedGames")
      .populate("signedGames.gameDetails");
    if (!response) {
      logger.info(`MongoDB: User "${username}" not found`);
    } else {
      logger.debug(`MongoDB: Found user "${username}"`);
    }
    return makeSuccessResult(response);
  } catch (error) {
    logger.error(`MongoDB: Error finding user ${username} - ${error}`);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const findUserBySerial = async (
  serial: string
): Promise<AsyncResult<User | null, MongoDbError>> => {
  try {
    const response = await UserModel.findOne({ serial }, "-signedGames._id")
      .lean<User>()
      .populate("favoritedGames")
      .populate("signedGames.gameDetails");

    if (!response) {
      logger.info(`MongoDB: User with serial "${serial}" not found`);
    } else {
      logger.debug(`MongoDB: Found user with serial "${serial}"`);
    }
    return makeSuccessResult(response);
  } catch (error) {
    logger.error(
      `MongoDB: Error finding user with serial ${serial} - ${error}`
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const findUserSerial = async (
  serialData: Serial
): Promise<AsyncResult<User | null, MongoDbError>> => {
  const serial = serialData.serial;

  try {
    const response = await UserModel.findOne({ serial }).lean<User>();
    if (!response) {
      logger.info(`MongoDB: Serial "${serial}" not found`);
    } else {
      logger.debug(`MongoDB: Found Serial "${serial}"`);
    }
    return makeSuccessResult(response);
  } catch (error) {
    logger.error(`MongoDB: Error finding Serial ${serial} - ${error}`);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const findUsers = async (): Promise<
  AsyncResult<User[], MongoDbError>
> => {
  logger.debug(`MongoDB: Find all users`);
  try {
    const users = await UserModel.find({})
      .lean<User[]>()
      .populate("favoritedGames")
      .populate("signedGames.gameDetails");
    return makeSuccessResult(users);
  } catch (error) {
    logger.error(`MongoDB: Error fetching users - ${error}`);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};
