import { UserModel } from "server/features/user/userSchema";
import { logger } from "server/utils/logger";
import { User } from "shared/typings/models/user";

export const findGroupMembers = async (groupCode: string): Promise<User[]> => {
  let response: User[];
  try {
    response = await UserModel.find({ groupCode })
      .lean<User>()
      .populate("favoritedGames")
      .populate("signedGames.gameDetails");
  } catch (error) {
    logger.error(`MongoDB: Error finding group ${groupCode} - ${error}`);
    throw error;
  }

  if (!response || response.length === 0) {
    logger.info(`MongoDB: group "${groupCode}" not found`);
  } else {
    logger.debug(
      `MongoDB: Found group "${groupCode}" with ${response.length} members`
    );
  }
  return response;
};

export const findGroup = async (
  groupCode: string,
  username: string
): Promise<User | null> => {
  let response;
  if (username) {
    try {
      response = await UserModel.findOne({ groupCode, username }).lean<User>();
    } catch (error) {
      logger.error(`MongoDB: Error finding group ${groupCode} - ${error}`);
      throw error;
    }

    if (!response) {
      logger.info(
        `MongoDB: Group "${groupCode}" with creator "${username}" not found`
      );
    } else {
      logger.info(
        `MongoDB: Group "${groupCode}" with creator "${username}" found`
      );
    }
    return response;
  } else {
    try {
      response = await UserModel.findOne({ groupCode }).lean<User>();
    } catch (error) {
      logger.error(`MongoDB: Error finding group ${groupCode} - ${error}`);
      throw error;
    }

    if (!response) {
      logger.info(`MongoDB: Group "${groupCode}" not found`);
    } else {
      logger.info(`MongoDB: Group "${groupCode}" found`);
    }
    return response;
  }
};

export const saveGroupCode = async (
  groupCode: string,
  username: string
): Promise<User | null> => {
  let response;

  try {
    response = await UserModel.findOneAndUpdate(
      { username },
      { groupCode },
      { new: true, fields: "groupCode" }
    ).lean<User>();
  } catch (error) {
    logger.error(
      `MongoDB: Error storing group "${groupCode}" stored for user "${username}" - ${error}`
    );
    throw error;
  }

  if (groupCode === "0") {
    logger.info(`MongoDB: User "${username}" left group`);
  } else {
    logger.info(`MongoDB: Group "${groupCode}" stored for user "${username}"`);
  }
  return response;
};
