import { mockGame } from 'server/test/mock-data/mockGame';
import { Result } from 'shared/typings/models/result';

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
