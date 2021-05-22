import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Application } from 'express';
import { startServer } from 'server/utils/startServer';
import { closeServer } from 'server/utils/closeServer';
import { RESULTS_ENDPOINT } from 'shared/constants/apiEndpoints';

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

test(`GET ${RESULTS_ENDPOINT} should return 422 without any parameters`, async () => {
  const response = await request(server).get(RESULTS_ENDPOINT);
  expect(response.status).toEqual(422);
});
