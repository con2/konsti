import { mockGame, mockGame2 } from 'server/test/mock-data/mockGame';
import { NewUserData } from 'server/typings/user.typings';
import { UserSignup } from 'server/typings/result.typings';
import { UserGroup } from 'shared/typings/models/user';
import { PostEnteredGameParameters } from 'shared/typings/api/signup';

export const mockUser: NewUserData = {
  username: 'Test User',
  passwordHash: 'testpass',
  userGroup: UserGroup.USER,
  serial: '1234ABCD',
  groupCode: '0',
  favoritedGames: [],
  signedGames: [],
  enteredGames: [],
};

export const mockSignup: UserSignup = {
  username: 'Test User',
  signedGames: [
    {
      gameDetails: mockGame,
      priority: 1,
      time: '2019-07-26T14:00:00.000Z',
      message: '',
    },
    {
      gameDetails: mockGame2,
      priority: 1,
      time: '2019-07-26T15:00:00.000Z',
      message: '',
    },
  ],
};

export const mockPostEnteredGameRequest: PostEnteredGameParameters = {
  username: mockUser.username,
  enteredGameId: mockGame.gameId,
  startTime: mockGame.startTime,
  message: '',
};
