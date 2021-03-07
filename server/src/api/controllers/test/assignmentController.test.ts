import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Application } from 'express';
import { startServer } from 'server/utils/startServer';
import { closeServer } from 'server/utils/closeServer';

let server: Application;
let mongoServer: MongoMemoryServer;
let mongoUri: string;

beforeEach(async () => {
  mongoServer = new MongoMemoryServer();
  mongoUri = await mongoServer.getUri();
  server = await startServer(mongoUri);
});

afterEach(async () => {
  await closeServer(server, mongoUri);
  await mongoServer.stop();
});

describe('POST /api/players', () => {
  test('should return 401 without valid authorization', async () => {
    const response = await request(server).post('/api/assignment');
    expect(response.status).toEqual(401);
  });
});
