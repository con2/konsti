import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Server } from 'http';
import { startServer, closeServer } from 'server/utils/server';
import { RESULTS_ENDPOINT } from 'shared/constants/apiEndpoints';

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

test(`GET ${RESULTS_ENDPOINT} should return 422 without any parameters`, async () => {
  const response = await request(server).get(RESULTS_ENDPOINT);
  expect(response.status).toEqual(422);
});
