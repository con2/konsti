import { logger } from 'utils/logger';
import { db } from 'db/mongodb';
import { UserModel } from 'db/user/userSchema';
import { Signup } from 'typings/result.typings';
import {
  User,
  NewUserData,
  EnteredGame,
  SignedGame,
  FavoritedGame,
  SaveFavoriteRequest,
  UserGroup,
} from 'typings/user.typings';
import { Serial } from 'typings/serial.typings';
import { GameDoc } from 'typings/game.typings';

const removeUsers = async (): Promise<void> => {
  logger.info('MongoDB: remove ALL users from db');
  try {
    await UserModel.deleteMany({});
  } catch (error) {
    throw new Error(`MongoDB: Error removing users: ${error}`);
  }
};

const saveUser = async (newUserData: NewUserData): Promise<User> => {
  const user = new UserModel({
    username: newUserData.username,
    password: newUserData.passwordHash,
    userGroup: newUserData.userGroup ? newUserData.userGroup : UserGroup.user,
    serial: newUserData.serial,
    groupCode:
      typeof newUserData.groupCode === 'string' ? newUserData.groupCode : '0',
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
    return error;
  }
};

const updateUser = async (user: User): Promise<User | null> => {
  let response;

  try {
    response = await UserModel.findOneAndUpdate(
      { username: user.username },
      {
        userGroup:
          typeof user.userGroup === 'string' ? user.userGroup : UserGroup.user,
        serial: user.serial,
        groupCode: typeof user.groupCode === 'string' ? user.groupCode : '0',
        favoritedGames: user.favoritedGames ?? [],
        signedGames: user.signedGames ?? [],
        enteredGames: user.enteredGames ?? [],
      },
      { new: true, fields: '-_id -__v -createdAt -updatedAt' }
    )
      .lean<User>()
      .populate('favoritedGames')
      .populate('enteredGames.gameDetails')
      .populate('signedGames.gameDetails');

    logger.debug(`MongoDB: User "${user.username}" updated`);

    return response;
  } catch (error) {
    logger.error(`MongoDB: Error updating user ${user.username} - ${error}`);
    return error;
  }
};

const updateUserPassword = async (
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
      { new: true, fields: '-_id -__v -createdAt -updatedAt' }
    )
      .lean<User>()
      .populate('favoritedGames')
      .populate('enteredGames.gameDetails')
      .populate('signedGames.gameDetails');

    logger.debug(`MongoDB: Password for user "${username}" updated`);

    return response;
  } catch (error) {
    logger.error(
      `MongoDB: Error updating password for user ${username} - ${error}`
    );
    return error;
  }
};

const findUser = async (username: string): Promise<User | null> => {
  let response;
  try {
    response = await UserModel.findOne(
      { username },
      '-signedGames._id -enteredGames._id'
    )
      .lean<User>()
      .populate('favoritedGames')
      .populate('enteredGames.gameDetails')
      .populate('signedGames.gameDetails');
  } catch (error) {
    logger.error(`MongoDB: Error finding user ${username} - ${error}`);
    return error;
  }

  if (!response) {
    logger.info(`MongoDB: User "${username}" not found`);
  } else {
    logger.debug(`MongoDB: Found user "${username}"`);
  }
  return response;
};

const findUserBySerial = async (serial: string): Promise<User | null> => {
  let response;
  try {
    response = await UserModel.findOne(
      { serial },
      '-signedGames._id -enteredGames._id'
    )
      .lean<User>()
      .populate('favoritedGames')
      .populate('enteredGames.gameDetails')
      .populate('signedGames.gameDetails');
  } catch (error) {
    logger.error(
      `MongoDB: Error finding user with serial ${serial} - ${error}`
    );
    return error;
  }

  if (!response) {
    logger.info(`MongoDB: User with serial "${serial}" not found`);
  } else {
    logger.debug(`MongoDB: Found user with serial "${serial}"`);
  }
  return response;
};

const findSerial = async (serialData: Serial): Promise<User | null> => {
  const serial = serialData.serial;

  let response;
  try {
    response = await UserModel.findOne({ serial }).lean<User>();
  } catch (error) {
    logger.error(`MongoDB: Error finding Serial ${serial} - ${error}`);
    return error;
  }

  if (!response) {
    logger.info(`MongoDB: Serial "${serial}" not found`);
  } else {
    logger.debug(`MongoDB: Found Serial "${serial}"`);
  }
  return response;
};

const findGroupMembers = async (groupCode: string): Promise<User[]> => {
  let response;
  try {
    response = await UserModel.find({ groupCode })
      .lean<User>()
      .populate('favoritedGames')
      .populate('enteredGames.gameDetails')
      .populate('signedGames.gameDetails');
  } catch (error) {
    logger.error(`MongoDB: Error finding group ${groupCode} - ${error}`);
    return error;
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

const findGroup = async (
  groupCode: string,
  username: string
): Promise<User | null> => {
  let response;
  if (username) {
    try {
      response = await UserModel.findOne({ groupCode, username }).lean<User>();
    } catch (error) {
      logger.error(`MongoDB: Error finding group ${groupCode} - ${error}`);
      return error;
    }

    if (!response) {
      logger.info(
        `MongoDB: Group "${groupCode}" with leader "${username}" not found`
      );
    } else {
      logger.info(
        `MongoDB: Group "${groupCode}" with leader "${username}" found`
      );
    }
    return response;
  } else {
    try {
      response = await UserModel.findOne({ groupCode }).lean<User>();
    } catch (error) {
      logger.error(`MongoDB: Error finding group ${groupCode} - ${error}`);
      return error;
    }

    if (!response) {
      logger.info(`MongoDB: Group "${groupCode}" not found`);
    } else {
      logger.info(`MongoDB: Group "${groupCode}" found`);
    }
    return response;
  }
};

const findUsers = async (): Promise<User[]> => {
  logger.debug(`MongoDB: Find all users`);
  let users;
  try {
    users = await UserModel.find({})
      .lean<User>()
      .populate('favoritedGames')
      .populate('enteredGames.gameDetails')
      .populate('signedGames.gameDetails');
  } catch (error) {
    throw new Error(`MongoDB: Error fetching users - ${error}`);
  }
  return users;
};

const saveSignup = async (signupData: Signup): Promise<User> => {
  const { signedGames, username } = signupData;

  let games: GameDoc[];
  try {
    games = await db.game.findGames();
  } catch (error) {
    logger.error(`MongoDB: Error loading games - ${error}`);
    return error;
  }

  const formattedData = signedGames.reduce<SignedGame[]>((acc, signedGame) => {
    const gameDocInDb = games.find(
      (game) => game.gameId === signedGame.gameDetails.gameId
    );

    if (gameDocInDb) {
      acc.push({
        gameDetails: gameDocInDb._id,
        priority: signedGame.priority,
        time: signedGame.time,
      });
    }
    return acc;
  }, []);

  let signupResponse;
  try {
    signupResponse = await UserModel.findOneAndUpdate(
      { username: username },
      {
        signedGames: formattedData,
      },
      { new: true, fields: '-signedGames._id' }
    ).populate('signedGames.gameDetails');
    if (!signupResponse) {
      throw new Error('Error saving signup');
    }
  } catch (error) {
    logger.error(
      `MongoDB: Error storing signup data for user "${username}" - ${error}`
    );
    return error;
  }

  logger.debug(`MongoDB: Signup data stored for user "${username}"`);
  return signupResponse;
};

const saveGroupCode = async (
  groupCode: string,
  username: string
): Promise<User | null> => {
  let response;

  try {
    response = await UserModel.findOneAndUpdate(
      { username: username },
      { groupCode: groupCode },
      { new: true, fields: 'groupCode' }
    ).lean<User>();
  } catch (error) {
    logger.error(
      `MongoDB: Error storing group "${groupCode}" stored for user "${username}" - ${error}`
    );
    return error;
  }

  if (groupCode === '0') {
    logger.info(`MongoDB: User "${username}" left group`);
  } else {
    logger.info(`MongoDB: Group "${groupCode}" stored for user "${username}"`);
  }
  return response;
};

const saveFavorite = async (
  favoriteData: SaveFavoriteRequest
): Promise<User | null> => {
  let games: GameDoc[];
  try {
    games = await db.game.findGames();
  } catch (error) {
    logger.error(`MongoDB: Error loading games - ${error}`);
    return error;
  }

  const favoritedGames = favoriteData.favoritedGames.reduce<FavoritedGame[]>(
    (acc, favoritedGame) => {
      const gameDocInDb = games.find(
        (game) => game.gameId === favoritedGame.gameId
      );

      if (gameDocInDb) {
        acc.push(gameDocInDb._id);
      }
      return acc;
    },
    []
  );

  let response;
  try {
    response = await UserModel.findOneAndUpdate(
      { username: favoriteData.username },
      {
        favoritedGames,
      },
      { new: true, fields: 'favoritedGames -_id' }
    )
      .lean<User>()
      .populate('favoritedGames', '-_id -__v -updatedAt -createdAt');
    logger.info(
      `MongoDB: Favorite data stored for user "${favoriteData.username}"`
    );
    return response;
  } catch (error) {
    logger.error(
      `MongoDB: Error storing favorite data for user "${favoriteData.username}" - ${error}`
    );
    return error;
  }
};

const saveEnteredGames = async (
  enteredGames: readonly EnteredGame[],
  username: string
): Promise<void> => {
  let response;
  try {
    response = await UserModel.updateOne(
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
    return response;
  } catch (error) {
    logger.error(
      `MongoDB: Error updating entered games for user ${username} - ${error}`
    );
    return error;
  }
};

export const user = {
  findSerial,
  findUser,
  findGroup,
  findUsers,
  removeUsers,
  saveFavorite,
  saveSignup,
  saveUser,
  findGroupMembers,
  saveGroupCode,
  updateUser,
  findUserBySerial,
  updateUserPassword,
  saveEnteredGames,
};
