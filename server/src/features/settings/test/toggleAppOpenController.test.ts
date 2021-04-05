import { Application } from 'express';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { startServer } from 'server/utils/startServer';
import { closeServer } from 'server/utils/closeServer';
import { TOGGLE_APP_OPEN_ENDPOINT } from 'shared/constants/apiEndpoints';

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

describe(`POST ${TOGGLE_APP_OPEN_ENDPOINT}`, () => {
  test('should return 401 without valid authorization', async () => {
    const response = await request(server).post(TOGGLE_APP_OPEN_ENDPOINT);
    expect(response.status).toEqual(401);
  });
});
