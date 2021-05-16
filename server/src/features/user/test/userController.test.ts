import { Application } from 'express';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { startServer } from 'server/utils/startServer';
import { closeServer } from 'server/utils/closeServer';
import {
  FAVORITE_ENDPOINT,
  GROUP_ENDPOINT,
  LOGIN_ENDPOINT,
  SIGNUP_ENDPOINT,
  USERS_BY_SERIAL_ENDPOINT,
  USERS_ENDPOINT,
} from 'shared/constants/apiEndpoints';

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

describe(`GET ${USERS_ENDPOINT}`, () => {
  test('should return 401 without valid authorization', async () => {
    const response = await request(server).get(USERS_ENDPOINT);
    expect(response.status).toEqual(401);
  });
});

describe(`GET ${USERS_BY_SERIAL_ENDPOINT}`, () => {
  test('should return 401 without valid authorization', async () => {
    const response = await request(server).get(USERS_BY_SERIAL_ENDPOINT);
    expect(response.status).toEqual(401);
  });
});

describe(`POST ${USERS_ENDPOINT}`, () => {
  test('should return 422 without username', async () => {
    const response = await request(server).post(USERS_ENDPOINT).send({
      password: 'testpass',
      serial: 'testserial',
    });
    expect(response.status).toEqual(422);
  });

  test('should return 422 without password', async () => {
    const response = await request(server).post(USERS_ENDPOINT).send({
      username: 'testuser',
      serial: 'testserial',
    });
    expect(response.status).toEqual(422);
  });

  test('should return 422 without serial', async () => {
    const response = await request(server).post(USERS_ENDPOINT).send({
      username: 'testuser',
      password: 'testpass',
    });
    expect(response.status).toEqual(422);
  });
});

describe(`POST ${FAVORITE_ENDPOINT}`, () => {
  test('should return 401 without valid authorization', async () => {
    const response = await request(server).post(FAVORITE_ENDPOINT);
    expect(response.status).toEqual(401);
  });
});

describe(`GET ${GROUP_ENDPOINT}`, () => {
  test('should return 401 without valid authorization', async () => {
    const response = await request(server).get(GROUP_ENDPOINT);
    expect(response.status).toEqual(401);
  });
});

describe(`POST ${GROUP_ENDPOINT}`, () => {
  test('should return 401 without valid authorization', async () => {
    const response = await request(server).post(GROUP_ENDPOINT);
    expect(response.status).toEqual(401);
  });
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

describe(`POST ${SIGNUP_ENDPOINT}`, () => {
  test('should return 401 without valid authorization', async () => {
    const response = await request(server).post(SIGNUP_ENDPOINT);
    expect(response.status).toEqual(401);
  });
});
