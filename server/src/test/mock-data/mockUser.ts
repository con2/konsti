import { mockGame, mockGame2 } from 'test/mock-data/mockGame';
import { NewUserData, UserGroup } from 'typings/user.typings';
import { Signup } from 'typings/result.typings';

export const mockUser: NewUserData = {
  favoritedGames: [],
  username: 'Test User',
  passwordHash: 'testpass',
  userGroup: UserGroup.user,
  serial: '1234ABCD',
  groupCode: '0',
  signedGames: [],
  enteredGames: [],
};

export const mockSignup: Signup = {
  username: 'Test User',
  signedGames: [
    {
      gameDetails: mockGame,
      priority: 1,
      time: '2019-07-26T14:00:00.000Z',
    },
    {
      gameDetails: mockGame2,
      priority: 1,
      time: '2019-07-26T15:00:00.000Z',
    },
  ],
};
