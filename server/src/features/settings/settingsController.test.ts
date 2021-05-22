import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Application } from 'express';
import { startServer } from 'server/utils/startServer';
import { closeServer } from 'server/utils/closeServer';
import {
  HIDDEN_ENDPOINT,
  SETTINGS_ENDPOINT,
  SIGNUPTIME_ENDPOINT,
  TOGGLE_APP_OPEN_ENDPOINT,
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
  await closeServer(undefined, mongoUri);
  await mongoServer.stop();
});

describe(`GET ${SETTINGS_ENDPOINT}`, () => {
  test('should return 200', async () => {
    const response = await request(server).get(SETTINGS_ENDPOINT);
    expect(response.status).toEqual(200);
  });
});

describe(`POST ${HIDDEN_ENDPOINT}`, () => {
  test('should return 401 without valid authorization', async () => {
    const response = await request(server).post(HIDDEN_ENDPOINT);
    expect(response.status).toEqual(401);
  });
});

describe(`POST ${SIGNUPTIME_ENDPOINT}`, () => {
  test('should return 401 without valid authorization', async () => {
    const response = await request(server).post(SIGNUPTIME_ENDPOINT);
    expect(response.status).toEqual(401);
  });
});

describe(`POST ${TOGGLE_APP_OPEN_ENDPOINT}`, () => {
  test('should return 401 without valid authorization', async () => {
    const response = await request(server).post(TOGGLE_APP_OPEN_ENDPOINT);
    expect(response.status).toEqual(401);
  });
});
