import dayjs from "dayjs";
import { logger } from "server/utils/logger";
import { UserModel } from "server/features/user/userSchema";
import { NewUser } from "server/types/userTypes";
import { Serial } from "server/types/serialTypes";
import { User, UserGroup } from "shared/types/models/user";
import {
  Result,
  makeErrorResult,
  makeSuccessResult,
} from "shared/utils/result";
import { MongoDbError } from "shared/types/api/errors";

export const removeUsers = async (): Promise<Result<void, MongoDbError>> => {
  logger.info("MongoDB: remove ALL users from db");
  try {
    await UserModel.deleteMany({});
    return makeSuccessResult();
  } catch (error) {
    logger.error("MongoDB: Error removing users: %s", error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const saveUser = async (
  newUserData: NewUser,
): Promise<Result<User, MongoDbError>> => {
  const newUser: Omit<User, "createdAt"> = {
    kompassiId: newUserData.kompassiId,
    kompassiUsernameAccepted: false,
    username: newUserData.username,
    password: newUserData.passwordHash,
    userGroup: newUserData.userGroup ?? UserGroup.USER,
    serial: newUserData.serial,
    groupCode:
      typeof newUserData.groupCode === "string" ? newUserData.groupCode : "0",
    groupCreatorCode:
      typeof newUserData.groupCreatorCode === "string"
        ? newUserData.groupCreatorCode
        : "0",
    favoriteProgramItemIds: [],
    lotterySignups: [],
    eventLogItems: [],
  };

  const user = new UserModel(newUser);

  try {
    const response = await user.save();
    logger.info(`MongoDB: User ${newUserData.username} saved to DB`);
    return makeSuccessResult(response);
  } catch (error) {
    logger.error(
      `MongoDB: Error creating new user ${newUserData.username}: %s`,
      error,
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const updateUsersByUsername = async (
  users: User[],
): Promise<Result<void, MongoDbError>> => {
  const bulkOps = users.map((user) => {
    return {
      updateOne: {
        filter: {
          username: user.username,
        },
        update: {
          userGroup: user.userGroup,
          serial: user.serial,
          groupCode: user.groupCode,
          favoriteProgramItemIds: user.favoriteProgramItemIds,
          lotterySignups: user.lotterySignups,
        },
      },
    };
  });

  try {
    await UserModel.bulkWrite(bulkOps);
    return makeSuccessResult();
  } catch (error) {
    logger.error(
      `MongoDB: Error updating users ${String(users.map((user) => user.username))}: %s`,
      error,
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const updateUserPassword = async (
  username: string,
  password: string,
): Promise<Result<User, MongoDbError>> => {
  try {
    const response = await UserModel.findOneAndUpdate(
      // Don't update Kompassi login users
      { username, kompassiId: 0 },
      {
        password,
      },
      { new: true, fields: "-_id -__v -createdAt -updatedAt" },
    ).lean<User>();
    logger.debug(`MongoDB: Password for user ${username} updated`);
    if (!response) {
      return makeErrorResult(MongoDbError.USER_NOT_FOUND);
    }
    return makeSuccessResult(response);
  } catch (error) {
    logger.error(
      `MongoDB: Error updating password for user ${username}: %s`,
      error,
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const findUser = async (
  username: string,
): Promise<Result<User | null, MongoDbError>> => {
  try {
    const response = await UserModel.findOne({ username }).lean<User>();
    if (!response) {
      logger.info(`MongoDB: User ${username} not found`);
      return makeSuccessResult(null);
    }
    logger.debug(`MongoDB: Found user ${username}`);
    return makeSuccessResult({
      ...response,
      lotterySignups: response.lotterySignups.map((lotterySignup) => ({
        ...lotterySignup,
        signedToStartTime: dayjs(lotterySignup.signedToStartTime).toISOString(),
      })),
      eventLogItems: response.eventLogItems.map((logItem) => ({
        ...logItem,
        programItemStartTime: dayjs(logItem.programItemStartTime).toISOString(),
        createdAt: dayjs(logItem.createdAt).toISOString(),
      })),
    });
  } catch (error) {
    logger.error(`MongoDB: Error finding user ${username}: %s`, error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const findUserBySerial = async (
  serial: string,
): Promise<Result<User | null, MongoDbError>> => {
  try {
    const response = await UserModel.findOne({ serial }).lean<User>();

    if (response) {
      logger.debug(`MongoDB: Found user with serial ${serial}`);
    } else {
      logger.info(`MongoDB: User with serial ${serial} not found`);
    }
    return makeSuccessResult(response);
  } catch (error) {
    logger.error(
      `MongoDB: Error finding user with serial ${serial}: %s`,
      error,
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const findUserByKompassiId = async (
  kompassiId: number,
): Promise<Result<User | null, MongoDbError>> => {
  try {
    const response = await UserModel.findOne({ kompassiId }).lean<User>();

    if (response) {
      logger.debug(`MongoDB: Found user with Kompassi id ${kompassiId}`);
    } else {
      logger.info(`MongoDB: User with Kompassi id ${kompassiId} not found`);
    }
    return makeSuccessResult(response);
  } catch (error) {
    logger.error(
      `MongoDB: Error finding user with Kompassi id ${kompassiId}: %s`,
      error,
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const findUserSerial = async (
  serialData: Serial,
): Promise<Result<User | null, MongoDbError>> => {
  const serial = serialData.serial;

  try {
    const response = await UserModel.findOne({ serial }).lean<User>();
    if (response) {
      logger.debug(`MongoDB: Found Serial ${serial}`);
    } else {
      logger.info(`MongoDB: Serial ${serial} not found`);
    }
    return makeSuccessResult(response);
  } catch (error) {
    logger.error(`MongoDB: Error finding Serial ${serial}: %s`, error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const findUsers = async (
  usernames?: string[],
): Promise<Result<User[], MongoDbError>> => {
  logger.debug("MongoDB: Find all users");

  const filter = usernames ? { username: { $in: usernames } } : {};
  try {
    // eslint-disable-next-line unicorn/no-array-callback-reference -- False positive
    const users = await UserModel.find(filter).lean<User[]>();
    return makeSuccessResult(users);
  } catch (error) {
    logger.error("MongoDB: Error fetching users: %s", error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const updateUserKompassiLoginStatus = async (
  oldUsername: string,
  newUsername: string,
): Promise<Result<User, MongoDbError>> => {
  try {
    const response = await UserModel.findOneAndUpdate(
      { username: oldUsername },
      {
        username: newUsername,
        kompassiUsernameAccepted: true,
      },
      { new: true, fields: "-_id -__v -createdAt -updatedAt" },
    ).lean<User>();

    if (!response) {
      logger.error(
        "%s",
        new Error(
          `MongoDB: Error updating Kompassi login status for user ${oldUsername}, user not found`,
        ),
      );
      return makeErrorResult(MongoDbError.USER_NOT_FOUND);
    }
    return makeSuccessResult(response);
  } catch (error) {
    logger.error(
      `MongoDB: Error updating Kompassi login status for user ${oldUsername}: %s`,
      error,
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};
