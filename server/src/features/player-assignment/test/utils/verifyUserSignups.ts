import moment from 'moment';
import { logger } from 'server/utils/logger';
import { User } from 'shared/typings/models/user';
import { findUsers } from 'server/features/user/userRepository';

export const verifyUserSignups = async (): Promise<void> => {
  logger.info('Verify entered games and signups match for users');

  let users: User[];
  try {
    users = await findUsers();
  } catch (error) {
    logger.error(error);
    return;
  }

  users.map((user) => {
    // Group member enteredGames match with group leader signedGames
    const groupLeader = getGroupLeader(users, user);

    user.enteredGames.map((enteredGame) => {
      const gameFound = !!groupLeader.signedGames.find(
        (signedGame) =>
          signedGame.gameDetails.gameId === enteredGame.gameDetails.gameId &&
          moment(signedGame.gameDetails.startTime).isSame(
            enteredGame.gameDetails.startTime
          )
      );

      if (gameFound) {
        logger.info(
          `Signup found: "${user.username}" - "${enteredGame.gameDetails.title}"`
        );
      }

      if (!gameFound) {
        logger.error(
          `Signup not found: "${user.username}" - "${enteredGame.gameDetails.title}"`
        );
      }
    });
  });
};

const getGroupLeader = (users: User[], user: User): User => {
  // User is group member, not group leader
  if (user.groupCode !== '0' && user.groupCode !== user.serial) {
    const groupLeader = users.find(
      (leader) => leader.serial === user.groupCode
    );

    if (groupLeader) {
      return groupLeader;
    } else {
      logger.error(`Group leader not found for user ${user.username}`);
    }
  }

  // User is group leader
  return user;
};
