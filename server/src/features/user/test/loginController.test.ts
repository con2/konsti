import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Application } from 'express';
import { startServer } from 'server/utils/startServer';
import { closeServer } from 'server/utils/closeServer';
import { LOGIN_ENDPOINT } from 'shared/constants/apiEndpoints';

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

describe(`POST ${LOGIN_ENDPOINT}`, () => {
  test('should return 422 without any parameters', async () => {
    const response = await request(server).post(LOGIN_ENDPOINT);
    expect(response.status).toEqual(422);
  });

  test('should return 422 if username is found but password is missing', async () => {
    const response = await request(server).post(LOGIN_ENDPOINT).send({
      username: 'testuser',
    });
    expect(response.status).toEqual(422);
  });

  test('should return 422 if password is found but username is missing', async () => {
    const response = await request(server).post(LOGIN_ENDPOINT).send({
      password: 'testpass',
    });
    expect(response.status).toEqual(422);
  });

  test('should return 422 if password, username, and jwt are found', async () => {
    const response = await request(server)
      .post(LOGIN_ENDPOINT)
      .send({ username: 'testuser', password: 'testpass', jwt: 'testjwt' });
    expect(response.status).toEqual(422);
  });

  test('should return 200 if password and username are found', async () => {
    const response = await request(server)
      .post(LOGIN_ENDPOINT)
      .send({ username: 'testuser', password: 'testpass' });
    expect(response.status).toEqual(200);
  });

  test('should return 200 if jwt is found', async () => {
    const response = await request(server)
      .post(LOGIN_ENDPOINT)
      .send({ jwt: 'testjwt' });
    expect(response.status).toEqual(200);
  });
});
