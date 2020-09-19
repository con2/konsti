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

describe('GET /api/user', () => {
  test('should return 401 without valid authorization', async () => {
    const response = await request(server).get('/api/user');
    expect(response.status).toEqual(401);
  });
});

describe('POST /api/user', () => {
  test('should return 422 without username', async () => {
    const response = await request(server).post('/api/user').send({
      password: 'testpass',
      serial: 'testserial',
    });
    expect(response.status).toEqual(422);
  });

  test('should return 422 without password', async () => {
    const response = await request(server).post('/api/user').send({
      username: 'testuser',
      serial: 'testserial',
    });
    expect(response.status).toEqual(422);
  });

  test('should return 422 without serial', async () => {
    const response = await request(server).post('/api/user').send({
      username: 'testuser',
      password: 'testpass',
    });
    expect(response.status).toEqual(422);
  });
});
