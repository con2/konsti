import { getList } from '../getList';
import { UserArray, User, UserGroup } from 'typings/user.typings';
import { mockGame } from 'test/mock-data/mockGame';

const user: User = {
  username: 'username',
  password: 'password',
  userGroup: 'user' as UserGroup,
  serial: '123',
  groupCode: '123',
  favoritedGames: [],
  signedGames: [
    { gameDetails: mockGame, priority: 1, time: '2019-11-23T12:00:00+02:00' },
  ],
  enteredGames: [],
  createdAt: null,
};

const user2: User = {
  username: 'username 2',
  password: 'password',
  userGroup: 'user' as UserGroup,
  serial: '456',
  groupCode: '123',
  favoritedGames: [],
  signedGames: [],
  enteredGames: [],
  createdAt: null,
};

const user3: User = {
  username: 'username 3',
  password: 'password',
  userGroup: 'user' as UserGroup,
  serial: '456',
  groupCode: '123',
  favoritedGames: [],
  signedGames: [],
  enteredGames: [
    { gameDetails: mockGame, priority: 1, time: '2019-11-23T12:00:00+02:00' },
  ],
  createdAt: null,
};

const startingTime = '2019-11-23T12:00:00+02:00';

test('should generate assignment list with bonuses for single user', async () => {
  const userArray: readonly User[] = [user];
  const playerGroups: readonly UserArray[] = [userArray, userArray, userArray];
  const list = getList(playerGroups, startingTime);

  expect(list).toEqual([
    { event: 'p2106', gain: 21, id: '123', size: 1 },
    { event: 'p2106', gain: 21, id: '123', size: 1 },
    { event: 'p2106', gain: 21, id: '123', size: 1 },
  ]);
});

test('should generate assignment list with bonuses for group', async () => {
  const userArray: readonly User[] = [user, user2];
  const playerGroups: readonly UserArray[] = [userArray, userArray, userArray];
  const list = getList(playerGroups, startingTime);

  expect(list).toEqual([
    { event: 'p2106', gain: 21, id: '123', size: 2 },
    { event: 'p2106', gain: 21, id: '123', size: 2 },
    { event: 'p2106', gain: 21, id: '123', size: 2 },
  ]);
});

test('should generate assignment list without bonuses for group', async () => {
  const userArray: readonly User[] = [user, user3];
  const playerGroups: readonly UserArray[] = [userArray, userArray, userArray];
  const list = getList(playerGroups, startingTime);

  expect(list).toEqual([
    { event: 'p2106', gain: 1, id: '123', size: 2 },
    { event: 'p2106', gain: 1, id: '123', size: 2 },
    { event: 'p2106', gain: 1, id: '123', size: 2 },
  ]);
});
