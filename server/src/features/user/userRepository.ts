import { logger } from 'server/utils/logger';
import { UserModel } from 'server/features/user/userSchema';
import { Signup } from 'server/typings/result.typings';
import { NewUserData, SaveFavoriteRequest } from 'server/typings/user.typings';
import { Serial } from 'server/typings/serial.typings';
import { GameDoc } from 'server/typings/game.typings';
import { findGames } from 'server/features/game/gameRepository';
import { Game } from 'shared/typings/models/game';
import {
  EnteredGame,
  FavoritedGame,
  SignedGame,
  User,
  UserGroup,
} from 'shared/typings/models/user';

export const removeUsers = async (): Promise<void> => {
  logger.info('MongoDB: remove ALL users from db');
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

export const updateUser = async (user: User): Promise<User | null> => {
  let response;

  try {
    response = await UserModel.findOneAndUpdate(
      { username: user.username },
      {
        userGroup:
          typeof user.userGroup === 'string' ? user.userGroup : UserGroup.USER,
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

export const findUser = async (username: string): Promise<User | null> => {
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

export const findUserBySerial = async (
  serial: string
): Promise<User | null> => {
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

export const findUserSerial = async (
  serialData: Serial
): Promise<User | null> => {
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

export const findGroupMembers = async (groupCode: string): Promise<User[]> => {
  let response: User[];
  try {
    // @ts-expect-error: Returns User even though it definitely should be User[]
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

export const findUsers = async (): Promise<User[]> => {
  logger.debug(`MongoDB: Find all users`);
  let users: User[];
  try {
    // @ts-expect-error: Returns User even though it definitely should be User[]
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

export const saveSignup = async (signupData: Signup): Promise<User> => {
  const { signedGames, username } = signupData;

  let games: GameDoc[];
  try {
    games = await findGames();
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

export const saveGroupCode = async (
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

export const saveFavorite = async (
  favoriteData: SaveFavoriteRequest
): Promise<readonly Game[] | null> => {
  let games: GameDoc[];
  try {
    games = await findGames();
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
    return response.favoritedGames as Game[];
  } catch (error) {
    logger.error(
      `MongoDB: Error storing favorite data for user "${favoriteData.username}" - ${error}`
    );
    return error;
  }
};

export const saveEnteredGames = async (
  enteredGames: readonly EnteredGame[],
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
    return error;
  }
};
