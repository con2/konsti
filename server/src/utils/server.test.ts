import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Server } from 'http';
import { startServer, closeServer } from 'server/utils/server';

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

test('should return 400 if request is not valid json', async () => {
  const response = await request(server).post('/foobar').send('notJSON');
  expect(response.status).toEqual(400);
});
