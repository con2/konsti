import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Application } from 'express';
import { startServer } from 'server/utils/startServer';
import { closeServer } from 'server/utils/closeServer';
import { SETTINGS_ENDPOINT } from 'shared/constants/apiEndpoints';

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

describe(`GET ${SETTINGS_ENDPOINT}`, () => {
  test('should return 200', async () => {
    const response = await request(server).get(SETTINGS_ENDPOINT);
    expect(response.status).toEqual(200);
  });
});
