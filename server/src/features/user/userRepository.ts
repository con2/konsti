import { logger } from "server/utils/logger";
import { UserModel } from "server/features/user/userSchema";
import { NewUser } from "server/typings/user.typings";
import { Serial } from "server/typings/serial.typings";
import { User, UserGroup } from "shared/typings/models/user";

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
    enteredGames: [],
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
        enteredGames: user.enteredGames,
      },
      { new: true, fields: "-_id -__v -createdAt -updatedAt" }
    )
      .lean<User>()
      .populate("favoritedGames")
      .populate("enteredGames.gameDetails")
      .populate("signedGames.gameDetails");
  } catch (error) {
    logger.error(`MongoDB: Error updating user ${user.username} - ${error}`);
    throw error;
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
      { username: username },
      {
        password: password,
      },
      { new: true, fields: "-_id -__v -createdAt -updatedAt" }
    )
      .lean<User>()
      .populate("favoritedGames")
      .populate("enteredGames.gameDetails")
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

export const findUser = async (username: string): Promise<User | null> => {
  let response;
  try {
    response = await UserModel.findOne(
      { username },
      "-signedGames._id -enteredGames._id"
    )
      .lean<User>()
      .populate("favoritedGames")
      .populate("enteredGames.gameDetails")
      .populate("signedGames.gameDetails");
  } catch (error) {
    logger.error(`MongoDB: Error finding user ${username} - ${error}`);
    throw error;
  }

  if (!response) {
    logger.info(`MongoDB: User "${username}" not found`);
  } else {
    logger.debug(`MongoDB: Found user "${username}"`);
  }
  return response;
};

export const findUserBySerial = async (
  serial: string
): Promise<User | null> => {
  let response;
  try {
    response = await UserModel.findOne(
      { serial },
      "-signedGames._id -enteredGames._id"
    )
      .lean<User>()
      .populate("favoritedGames")
      .populate("enteredGames.gameDetails")
      .populate("signedGames.gameDetails");
  } catch (error) {
    logger.error(
      `MongoDB: Error finding user with serial ${serial} - ${error}`
    );
    throw error;
  }

  if (!response) {
    logger.info(`MongoDB: User with serial "${serial}" not found`);
  } else {
    logger.debug(`MongoDB: Found user with serial "${serial}"`);
  }
  return response;
};

export const findUserSerial = async (
  serialData: Serial
): Promise<User | null> => {
  const serial = serialData.serial;

  let response;
  try {
    response = await UserModel.findOne({ serial }).lean<User>();
  } catch (error) {
    logger.error(`MongoDB: Error finding Serial ${serial} - ${error}`);
    throw error;
  }

  if (!response) {
    logger.info(`MongoDB: Serial "${serial}" not found`);
  } else {
    logger.debug(`MongoDB: Found Serial "${serial}"`);
  }
  return response;
};

export const findUsers = async (): Promise<User[]> => {
  logger.debug(`MongoDB: Find all users`);
  let users: User[];
  try {
    users = await UserModel.find({})
      .lean<User>()
      .populate("favoritedGames")
      .populate("enteredGames.gameDetails")
      .populate("signedGames.gameDetails");
  } catch (error) {
    throw new Error(`MongoDB: Error fetching users - ${error}`);
  }
  return users;
};
