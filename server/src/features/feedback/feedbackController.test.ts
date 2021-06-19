import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Server } from 'http';
import { startServer, closeServer } from 'server/utils/server';
import { FEEDBACK_ENDPOINT } from 'shared/constants/apiEndpoints';

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

test(`POST ${FEEDBACK_ENDPOINT} should return 401 without valid authorization`, async () => {
  const response = await request(server).post(FEEDBACK_ENDPOINT);
  expect(response.status).toEqual(401);
});
