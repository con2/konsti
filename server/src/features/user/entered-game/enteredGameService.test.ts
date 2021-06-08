import { Server } from 'http';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { startServer } from 'server/utils/startServer';
import { closeServer } from 'server/utils/closeServer';
import { ENTERED_GAME_ENDPOINT } from 'shared/constants/apiEndpoints';
import { getJWT } from 'server/utils/jwt';
import { UserGroup } from 'shared/typings/models/user';
import { mockUser } from 'server/test/mock-data/mockUser';
import { mockGame } from 'server/test/mock-data/mockGame';
import { findUser, saveUser } from 'server/features/user/userRepository';
import { findGames, saveGames } from 'server/features/game/gameRepository';

let server: Server;
let mongoServer: MongoMemoryServer;
let mongoUri: string;

beforeEach(async () => {
  mongoServer = new MongoMemoryServer();
  mongoUri = await mongoServer.getUri();
  server = await startServer(mongoUri);
});

afterEach(async () => {
  await closeServer(server);
  await mongoServer.stop();
});

describe(`POST ${ENTERED_GAME_ENDPOINT}`, () => {
  test('should return 401 without valid authorization', async () => {
    const response = await request(server).post(ENTERED_GAME_ENDPOINT);
    expect(response.status).toEqual(401);
  });

  test('should return 422 with invalid parameters', async () => {
    const response = await request(server)
      .post(ENTERED_GAME_ENDPOINT)
      .send({
        username: 'testuser',
        enteredGameId: 'ABCD1234',
      })
      .set(
        'Authorization',
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`
      );
    expect(response.status).toEqual(422);
  });

  test('should return error when game is not found', async () => {
    await saveUser(mockUser);

    const response = await request(server)
      .post(ENTERED_GAME_ENDPOINT)
      .send({
        username: mockUser.username,
        enteredGameId: 'invalid_game_id',
        startTime: '2019-07-26T13:00:00Z',
      })
      .set(
        'Authorization',
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`
      );
    expect(response.status).toEqual(200);
    expect(response.body.status).toEqual('error');
  });

  test('should return error when user is not found', async () => {
    await saveGames([mockGame]);

    const response = await request(server)
      .post(ENTERED_GAME_ENDPOINT)
      .send({
        username: 'user_not_found',
        enteredGameId: mockGame.gameId,
        startTime: mockGame.startTime,
      })
      .set(
        'Authorization',
        `Bearer ${getJWT(UserGroup.USER, 'user_not_found')}`
      );
    expect(response.status).toEqual(200);
    expect(response.body.status).toEqual('error');
  });

  test('should return success when user and game are found', async () => {
    // Populate database
    await saveGames([mockGame]);
    await saveUser(mockUser);

    // Check starting conditions
    const nonModifiedUser = await findUser(mockUser.username);
    expect(nonModifiedUser?.enteredGames.length).toEqual(0);

    // Update entered games
    const response = await request(server)
      .post(ENTERED_GAME_ENDPOINT)
      .send({
        username: mockUser.username,
        enteredGameId: mockGame.gameId,
        startTime: mockGame.startTime,
      })
      .set(
        'Authorization',
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`
      );

    // Check API response
    expect(response.status).toEqual(200);
    expect(response.body.message).toEqual('Store entered game success');
    expect(response.body.status).toEqual('success');

    // Check database
    const modifiedUser = await findUser(mockUser.username);
    expect(modifiedUser?.enteredGames[0].gameDetails.gameId).toEqual(
      mockGame.gameId
    );
  });
});

describe(`DELETE ${ENTERED_GAME_ENDPOINT}`, () => {
  test('should return 401 without valid authorization', async () => {
    const response = await request(server).delete(ENTERED_GAME_ENDPOINT);
    expect(response.status).toEqual(401);
  });

  test('should return 422 with invalid parameters', async () => {
    const response = await request(server)
      .delete(ENTERED_GAME_ENDPOINT)
      .send({
        username: 'testuser',
        enteredGameId: 'ABCD1234',
      })
      .set('Authorization', `Bearer ${getJWT(UserGroup.USER, 'testuser')}`);
    expect(response.status).toEqual(422);
  });

  test('should return error when game is not found', async () => {
    await saveUser(mockUser);

    const response = await request(server)
      .delete(ENTERED_GAME_ENDPOINT)
      .send({
        username: mockUser.username,
        enteredGameId: 'invalid_game_id',
        startTime: '2019-07-26T13:00:00Z',
      })
      .set(
        'Authorization',
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`
      );
    expect(response.status).toEqual(200);
    expect(response.body.status).toEqual('error');
  });

  test('should return error when user is not found', async () => {
    await saveGames([mockGame]);

    const response = await request(server)
      .delete(ENTERED_GAME_ENDPOINT)
      .send({
        username: 'user_not_found',
        enteredGameId: mockGame.gameId,
        startTime: mockGame.startTime,
      })
      .set(
        'Authorization',
        `Bearer ${getJWT(UserGroup.USER, 'user_not_found')}`
      );
    expect(response.status).toEqual(200);
    expect(response.body.status).toEqual('error');
  });

  test('should return success when user and game are found', async () => {
    // Populate database
    await saveGames([mockGame]);
    const games = await findGames();

    const mockUserWithEnteredGame = {
      ...mockUser,
      enteredGames: [
        {
          gameDetails: games[0]._id,
          priority: 1,
          time: mockGame.startTime,
        },
      ],
    };

    await saveUser(mockUserWithEnteredGame);

    // Check starting conditions
    const nonModifiedUser = await findUser(mockUser.username);
    expect(nonModifiedUser?.enteredGames.length).toEqual(1);

    // Update entered games
    const response = await request(server)
      .delete(ENTERED_GAME_ENDPOINT)
      .send({
        username: mockUser.username,
        enteredGameId: mockGame.gameId,
        startTime: mockGame.startTime,
      })
      .set(
        'Authorization',
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`
      );

    // Check API response
    expect(response.status).toEqual(200);
    expect(response.body.message).toEqual('Delete entered game success');
    expect(response.body.status).toEqual('success');

    // Check database
    const modifiedUser = await findUser(mockUser.username);
    expect(modifiedUser?.enteredGames.length).toEqual(0);
  });
});
