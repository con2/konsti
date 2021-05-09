import { Application } from 'express';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { startServer } from 'server/utils/startServer';
import { closeServer } from 'server/utils/closeServer';
import {
  ENTERED_GAME_ENDPOINT,
  USERS_BY_SERIAL_ENDPOINT,
  USERS_ENDPOINT,
} from 'shared/constants/apiEndpoints';

let server: Application;
let mongoServer: MongoMemoryServer;
let mongoUri: string;

beforeEach(async () => {
  mongoServer = new MongoMemoryServer();
  mongoUri = await mongoServer.getUri();
  server = await startServer(mongoUri);
});

afterEach(async () => {
  await closeServer(null, mongoUri);
  await mongoServer.stop();
});

describe(`GET ${USERS_ENDPOINT}`, () => {
  test('should return 401 without valid authorization', async () => {
    const response = await request(server).get(USERS_ENDPOINT);
    expect(response.status).toEqual(401);
  });
});

describe(`GET ${USERS_BY_SERIAL_ENDPOINT}`, () => {
  test('should return 401 without valid authorization', async () => {
    const response = await request(server).get(USERS_BY_SERIAL_ENDPOINT);
    expect(response.status).toEqual(401);
  });
});

describe(`POST ${USERS_ENDPOINT}`, () => {
  test('should return 422 without username', async () => {
    const response = await request(server).post(USERS_ENDPOINT).send({
      password: 'testpass',
      serial: 'testserial',
    });
    expect(response.status).toEqual(422);
  });

  test('should return 422 without password', async () => {
    const response = await request(server).post(USERS_ENDPOINT).send({
      username: 'testuser',
      serial: 'testserial',
    });
    expect(response.status).toEqual(422);
  });

  test('should return 422 without serial', async () => {
    const response = await request(server).post(USERS_ENDPOINT).send({
      username: 'testuser',
      password: 'testpass',
    });
    expect(response.status).toEqual(422);
  });
});

describe(`POST ${ENTERED_GAME_ENDPOINT}`, () => {
  test('should return 401 without valid authorization', async () => {
    const response = await request(server).post(ENTERED_GAME_ENDPOINT);
    expect(response.status).toEqual(401);
  });
});
