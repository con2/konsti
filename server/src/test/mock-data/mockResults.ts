import { mockGame } from 'test/mock-data/mockGame';
import { Result } from 'typings/result.typings';

export const mockResults: Result[] = [
  {
    username: 'Test User',
    enteredGame: {
      gameDetails: mockGame,
      priority: 1,
      time: ' 2019-07-26 14:00:00.000Z',
    },
  },
];
