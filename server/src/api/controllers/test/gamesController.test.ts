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
  await closeServer(null, mongoUri);
  await mongoServer.stop();
});

describe('GET /api/games', () => {
  test('should return 200', async () => {
    const response = await request(server).get('/api/games');
    expect(response.status).toEqual(200);
  });
});

describe('POST /api/games', () => {
  test('should return 401 without valid authorization', async () => {
    const response = await request(server).post('/api/games');
    expect(response.status).toEqual(401);
  });
});
