import { logger } from "server/utils/logger";
import { UserModel } from "server/features/user/userSchema";
import { UserSignup } from "server/typings/result.typings";
import { NewUserData } from "server/typings/user.typings";
import { Serial } from "server/typings/serial.typings";
import { GameDoc } from "server/typings/game.typings";
import { findGames } from "server/features/game/gameRepository";
import { SelectedGame, User, UserGroup } from "shared/typings/models/user";
import { SaveFavoriteRequest } from "shared/typings/api/favorite";
import {
  DeleteEnteredGameParameters,
  PostEnteredGameParameters,
} from "shared/typings/api/signup";
import { getGameById } from "server/features/game/gameUtils";
import { Game } from "shared/typings/models/game";

export const removeUsers = async (): Promise<void> => {
  logger.info("MongoDB: remove ALL users from db");
  try {
    await UserModel.deleteMany({});
  } catch (error) {
    throw new Error(`MongoDB: Error removing users: ${error}`);
  }
};

export const saveUser = async (newUserData: NewUserData): Promise<User> => {
  const user = new UserModel({
    username: newUserData.username,
    password: newUserData.passwordHash,
    userGroup: newUserData.userGroup ? newUserData.userGroup : UserGroup.USER,
    serial: newUserData.serial,
    groupCode:
      typeof newUserData.groupCode === "string" ? newUserData.groupCode : "0",
    favoritedGames: newUserData.favoritedGames ?? [],
    signedGames: newUserData.signedGames ?? [],
    enteredGames: newUserData.enteredGames ?? [],
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

export const updateUser = async (user: User): Promise<User | null> => {
  let response;

  try {
    response = await UserModel.findOneAndUpdate(
      { username: user.username },
      {
        userGroup:
          typeof user.userGroup === "string" ? user.userGroup : UserGroup.USER,
        serial: user.serial,
        groupCode: typeof user.groupCode === "string" ? user.groupCode : "0",
        favoritedGames: user.favoritedGames ?? [],
        signedGames: user.signedGames ?? [],
        enteredGames: user.enteredGames ?? [],
      },
      { new: true, fields: "-_id -__v -createdAt -updatedAt" }
    )
      .lean<User>()
      .populate("favoritedGames")
      .populate("enteredGames.gameDetails")
      .populate("signedGames.gameDetails");

    logger.debug(`MongoDB: User "${user.username}" updated`);

    return response;
  } catch (error) {
    logger.error(`MongoDB: Error updating user ${user.username} - ${error}`);
    throw error;
  }
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

export const findGroupMembers = async (groupCode: string): Promise<User[]> => {
  let response: User[];
  try {
    response = await UserModel.find({ groupCode })
      .lean<User>()
      .populate("favoritedGames")
      .populate("enteredGames.gameDetails")
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

export const saveSignup = async (signupData: UserSignup): Promise<User> => {
  const { signedGames, username } = signupData;

  let games: GameDoc[];
  try {
    games = await findGames();
  } catch (error) {
    logger.error(`MongoDB: Error loading games - ${error}`);
    throw error;
  }

  const formattedData = signedGames.reduce<SelectedGame[]>(
    (acc, signedGame) => {
      const gameDocInDb = games.find(
        (game) => game.gameId === signedGame.gameDetails.gameId
      );

      if (gameDocInDb) {
        acc.push({
          gameDetails: gameDocInDb._id,
          priority: signedGame.priority,
          time: signedGame.time,
          message: signedGame.message,
        });
      }
      return acc;
    },
    []
  );

  let signupResponse;
  try {
    signupResponse = await UserModel.findOneAndUpdate(
      { username: username },
      {
        signedGames: formattedData,
      },
      { new: true, fields: "-signedGames._id" }
    ).populate("signedGames.gameDetails");
    if (!signupResponse) {
      throw new Error("Error saving signup");
    }
  } catch (error) {
    logger.error(
      `MongoDB: Error storing signup data for user "${username}" - ${error}`
    );
    throw error;
  }

  logger.debug(`MongoDB: Signup data stored for user "${username}"`);
  return signupResponse;
};

export const saveGroupCode = async (
  groupCode: string,
  username: string
): Promise<User | null> => {
  let response;

  try {
    response = await UserModel.findOneAndUpdate(
      { username: username },
      { groupCode: groupCode },
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

export const saveFavorite = async (
  favoriteData: SaveFavoriteRequest
): Promise<readonly Game[] | null> => {
  const { username, favoritedGames } = favoriteData;

  const games = await findGames();

  const favoritedGamesWithDocId = favoritedGames.reduce<string[]>(
    (acc, favoritedGame) => {
      const gameDocInDb = games.find((game) => game.gameId === favoritedGame);

      if (gameDocInDb) {
        acc.push(gameDocInDb._id as string);
      }
      return acc;
    },
    []
  );

  let response;
  try {
    response = await UserModel.findOneAndUpdate(
      { username },
      {
        favoritedGames: favoritedGamesWithDocId,
      },
      { new: true, fields: "favoritedGames" }
    )
      .lean<User>()
      .populate("favoritedGames", "-_id -__v -updatedAt -createdAt");
    logger.info(
      `MongoDB: Favorite data stored for user "${favoriteData.username}"`
    );
    if (!response) {
      throw new Error(`User not found`);
    }
  } catch (error) {
    logger.error(
      `MongoDB: Error storing favorite data for user "${favoriteData.username}" - ${error}`
    );
    throw error;
  }

  return response.favoritedGames;
};

export const updateEnteredGames = async (
  enteredGames: readonly SelectedGame[],
  username: string
): Promise<void> => {
  try {
    await UserModel.updateOne(
      {
        username,
      },
      {
        enteredGames,
      }
    );

    logger.debug(
      `MongoDB: Updated entered games stored for user "${username}"`
    );
  } catch (error) {
    logger.error(
      `MongoDB: Error updating entered games for user ${username} - ${error}`
    );
    throw error;
  }
};

export const saveEnteredGame = async (
  enteredGameRequest: PostEnteredGameParameters
): Promise<User> => {
  const { username, enteredGameId, startTime, message } = enteredGameRequest;

  let game;
  try {
    game = await getGameById(enteredGameId);
  } catch (error) {
    logger.error(error);
    throw error;
  }

  let user;
  try {
    user = await UserModel.findOneAndUpdate(
      { username },
      {
        $push: {
          enteredGames: {
            gameDetails: game._id,
            priority: 1,
            time: startTime,
            message: message,
          },
        },
      },
      { new: true, fields: "-enteredGames._id -_id -__v -createdAt -updatedAt" }
    )
      .lean<User>()
      .populate("favoritedGames")
      .populate("enteredGames.gameDetails", "-_id -__v -updatedAt")
      .populate("signedGames.gameDetails");
  } catch (error) {
    logger.error(
      `MongoDB: Error saving entered game for user "${username}" - ${error}`
    );
    throw error;
  }

  if (!user) throw new Error(`Username ${username} not found`);

  logger.info(`MongoDB: Entered game saved for user "${username}"`);
  return user;
};

export const delEnteredGame = async (
  enteredGameRequest: DeleteEnteredGameParameters
): Promise<User> => {
  const { username, enteredGameId, startTime } = enteredGameRequest;

  let game;
  try {
    game = await getGameById(enteredGameId);
  } catch (error) {
    logger.error(error);
    throw error;
  }

  let user;
  try {
    user = await UserModel.findOneAndUpdate(
      { username },
      {
        $pull: {
          enteredGames: {
            gameDetails: game._id,
            time: startTime,
          },
        },
      },
      { new: true }
    )
      .lean<User>()
      .populate("favoritedGames")
      .populate("enteredGames.gameDetails")
      .populate("signedGames.gameDetails");
  } catch (error) {
    logger.error(
      `MongoDB: Error deleting entered game from user "${username}" - ${error}`
    );
    throw error;
  }

  if (!user) throw new Error(`Username ${username} not found`);

  logger.info(`MongoDB: Entered game removed from user "${username}"`);
  return user;
};

export const removeSignedGames = async (): Promise<void> => {
  logger.info("MongoDB: remove ALL signups from db");
  try {
    await UserModel.updateMany({}, { signedGames: [] });
  } catch (error) {
    throw new Error(`MongoDB: Error removing signups: ${error}`);
  }
};

export const removeEnteredGames = async (): Promise<void> => {
  logger.info("MongoDB: remove ALL signups from db");
  try {
    await UserModel.updateMany({}, { enteredGames: [] });
  } catch (error) {
    throw new Error(`MongoDB: Error removing signups: ${error}`);
  }
};
