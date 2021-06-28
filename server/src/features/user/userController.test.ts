import request from 'supertest';
import {
  FAVORITE_ENDPOINT,
  GROUP_ENDPOINT,
  LOGIN_ENDPOINT,
  SIGNUP_ENDPOINT,
  USERS_BY_SERIAL_ENDPOINT,
  USERS_ENDPOINT,
} from 'shared/constants/apiEndpoints';
import { ConventionType } from 'shared/config/sharedConfig.types';
import { startTestServer, stopTestServer } from 'server/test/utils/testServer';

jest.mock('server/utils/logger');

afterEach(() => {
  jest.resetModules();
});

describe(`GET ${USERS_ENDPOINT}`, () => {
  test('should return 422 without valid body', async () => {
    const { server, mongoServer } = await startTestServer();

    const response = await request(server).get(USERS_ENDPOINT);
    expect(response.status).toEqual(422);

    await stopTestServer(server, mongoServer);
  });

  test('should return 401 without valid authorization', async () => {
    const { server, mongoServer } = await startTestServer();

    const response = await request(server)
      .get(USERS_ENDPOINT)
      .query({ username: 'testuser' });
    expect(response.status).toEqual(401);

    await stopTestServer(server, mongoServer);
  });
});

describe(`GET ${USERS_BY_SERIAL_ENDPOINT}`, () => {
  test('should return 422 without valid body', async () => {
    const { server, mongoServer } = await startTestServer();

    const response = await request(server).get(USERS_BY_SERIAL_ENDPOINT);
    expect(response.status).toEqual(422);

    await stopTestServer(server, mongoServer);
  });
});

describe(`POST ${USERS_ENDPOINT}`, () => {
  test('should return 422 without username', async () => {
    const { server, mongoServer } = await startTestServer();

    const response = await request(server).post(USERS_ENDPOINT).send({
      password: 'testpass',
      serial: 'testserial',
    });
    expect(response.status).toEqual(422);

    await stopTestServer(server, mongoServer);
  });

  test('should return 422 without password', async () => {
    const { server, mongoServer } = await startTestServer();

    const response = await request(server).post(USERS_ENDPOINT).send({
      username: 'testuser',
      serial: 'testserial',
    });
    expect(response.status).toEqual(422);

    await stopTestServer(server, mongoServer);
  });

  test('should return 422 without serial if convention is live', async () => {
    jest.mock('shared/config/sharedConfig', () => ({
      sharedConfig: { conventionType: ConventionType.LIVE },
    }));

    const { server, mongoServer } = await startTestServer();

    const response = await request(server).post(USERS_ENDPOINT).send({
      username: 'testuser',
      password: 'testpass',
    });
    expect(response.status).toEqual(422);

    await stopTestServer(server, mongoServer);
  });

  test('should return 200 without serial if convention is remote', async () => {
    jest.mock('shared/config/sharedConfig', () => ({
      sharedConfig: { conventionType: ConventionType.REMOTE },
    }));

    const { server, mongoServer } = await startTestServer();

    const response = await request(server).post(USERS_ENDPOINT).send({
      username: 'testuser',
      password: 'testpass',
    });
    expect(response.status).toEqual(200);

    await stopTestServer(server, mongoServer);
  });
});

describe(`POST ${FAVORITE_ENDPOINT}`, () => {
  test('should return 422 without valid body', async () => {
    const { server, mongoServer } = await startTestServer();

    const response = await request(server).post(FAVORITE_ENDPOINT);
    expect(response.status).toEqual(422);

    await stopTestServer(server, mongoServer);
  });

  test('should return 401 without valid authorization', async () => {
    const { server, mongoServer } = await startTestServer();

    const response = await request(server)
      .post(FAVORITE_ENDPOINT)
      .send({
        favoriteData: {
          username: 'testuser',
          favoritedGames: [],
        },
      });
    expect(response.status).toEqual(401);

    await stopTestServer(server, mongoServer);
  });
});

describe(`GET ${GROUP_ENDPOINT}`, () => {
  test('should return 422 without valid body', async () => {
    const { server, mongoServer } = await startTestServer();

    const response = await request(server).get(GROUP_ENDPOINT);
    expect(response.status).toEqual(422);

    await stopTestServer(server, mongoServer);
  });

  test('should return 401 without valid authorization', async () => {
    const { server, mongoServer } = await startTestServer();

    const response = await request(server).get(GROUP_ENDPOINT).query({
      username: 'testuser',
      groupCode: '1234',
    });
    expect(response.status).toEqual(401);

    await stopTestServer(server, mongoServer);
  });
});

describe(`POST ${GROUP_ENDPOINT}`, () => {
  test('should return 422 without valid body', async () => {
    const { server, mongoServer } = await startTestServer();

    const response = await request(server).post(GROUP_ENDPOINT);
    expect(response.status).toEqual(422);

    await stopTestServer(server, mongoServer);
  });

  test('should return 401 without valid authorization', async () => {
    const { server, mongoServer } = await startTestServer();

    const response = await request(server)
      .post(GROUP_ENDPOINT)
      .send({
        groupData: {
          groupCode: '1234',
          leader: true,
          ownSerial: '1234',
          username: 'testuser',
          leaveGroup: false,
          closeGroup: false,
        },
      });
    expect(response.status).toEqual(401);

    await stopTestServer(server, mongoServer);
  });
});

describe(`POST ${LOGIN_ENDPOINT}`, () => {
  test('should return 422 without any parameters', async () => {
    const { server, mongoServer } = await startTestServer();

    const response = await request(server).post(LOGIN_ENDPOINT);
    expect(response.status).toEqual(422);

    await stopTestServer(server, mongoServer);
  });

  test('should return 422 if username is found but password is missing', async () => {
    const { server, mongoServer } = await startTestServer();

    const response = await request(server).post(LOGIN_ENDPOINT).send({
      username: 'testuser',
    });
    expect(response.status).toEqual(422);

    await stopTestServer(server, mongoServer);
  });

  test('should return 422 if password is found but username is missing', async () => {
    const { server, mongoServer } = await startTestServer();

    const response = await request(server).post(LOGIN_ENDPOINT).send({
      password: 'testpass',
    });
    expect(response.status).toEqual(422);

    await stopTestServer(server, mongoServer);
  });

  test('should return 422 if password, username, and jwt are found', async () => {
    const { server, mongoServer } = await startTestServer();

    const response = await request(server)
      .post(LOGIN_ENDPOINT)
      .send({ username: 'testuser', password: 'testpass', jwt: 'testjwt' });
    expect(response.status).toEqual(422);

    await stopTestServer(server, mongoServer);
  });

  test('should return 200 if password and username are found', async () => {
    const { server, mongoServer } = await startTestServer();

    const response = await request(server)
      .post(LOGIN_ENDPOINT)
      .send({ username: 'testuser', password: 'testpass' });
    expect(response.status).toEqual(200);

    await stopTestServer(server, mongoServer);
  });

  test('should return 200 if jwt is found', async () => {
    const { server, mongoServer } = await startTestServer();

    const response = await request(server)
      .post(LOGIN_ENDPOINT)
      .send({ jwt: 'testjwt' });
    expect(response.status).toEqual(200);

    await stopTestServer(server, mongoServer);
  });
});

describe(`POST ${SIGNUP_ENDPOINT}`, () => {
  test('should return 422 without valid body', async () => {
    const { server, mongoServer } = await startTestServer();

    const response = await request(server).post(SIGNUP_ENDPOINT);
    expect(response.status).toEqual(422);

    await stopTestServer(server, mongoServer);
  });

  test('should return 401 without valid authorization', async () => {
    const { server, mongoServer } = await startTestServer();

    const response = await request(server)
      .post(SIGNUP_ENDPOINT)
      .send({
        signupData: {
          username: 'testuser',
          selectedGames: [],
          signupTime: '2019-11-23T08:00:00Z',
        },
      });
    expect(response.status).toEqual(401);

    await stopTestServer(server, mongoServer);
  });
});
