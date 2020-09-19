import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { startServer, closeServer } from 'server/server';
import { Application } from 'express';

let server: Application;
let mongoServer: MongoMemoryServer;
let mongoUri: string;

beforeEach(async () => {
  mongoServer = new MongoMemoryServer();
  mongoUri = await mongoServer.getConnectionString();
  server = await startServer(mongoUri);
});

afterEach(async () => {
  await closeServer(server, mongoUri);
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
