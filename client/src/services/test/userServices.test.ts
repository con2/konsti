import axios from 'axios';
import {
  getUser,
  getUserBySerial,
  postRegistration,
  updateUserPassword,
} from 'client/services/userServices';
import {
  USERS_BY_SERIAL_ENDPOINT,
  USERS_ENDPOINT,
} from 'shared/constants/apiEndpoints';

jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

test('GET user from server', async () => {
  mockAxios.get.mockImplementation(
    async () =>
      await Promise.resolve({
        status: 200,
        data: 'test response',
      })
  );

  const username = 'test username';

  const response = await getUser(username);

  expect(response).toEqual('test response');
  expect(mockAxios.get).toHaveBeenCalledTimes(1);
  expect(mockAxios.get).toHaveBeenCalledWith(USERS_ENDPOINT, {
    params: { username },
  });
});

test('GET user by serial from server', async () => {
  mockAxios.get.mockImplementation(
    async () =>
      await Promise.resolve({
        status: 200,
        data: 'test response',
      })
  );

  const serial = '12345';

  const response = await getUserBySerial(serial);

  expect(response).toEqual('test response');
  expect(mockAxios.get).toHaveBeenCalledTimes(1);
  expect(mockAxios.get).toHaveBeenCalledWith(USERS_BY_SERIAL_ENDPOINT, {
    params: { serial },
  });
});

test('POST registration to server', async () => {
  mockAxios.post.mockImplementation(async () => {
    return await Promise.resolve({
      status: 200,
      data: 'test response',
    });
  });

  const password = 'test password';
  const serial = '12345';
  const username = 'test username';

  const registrationFormFields = {
    password,
    serial,
    username,
    registerDescription: true,
  };

  const response = await postRegistration(registrationFormFields);

  expect(response).toEqual('test response');
  expect(mockAxios.post).toHaveBeenCalledTimes(1);
  expect(mockAxios.post).toHaveBeenCalledWith(USERS_ENDPOINT, {
    username,
    password,
    serial,
  });
});

test('POST new user password to server', async () => {
  mockAxios.post.mockImplementation(async () => {
    return await Promise.resolve({
      status: 200,
      data: 'test response',
    });
  });

  const username = 'test username';
  const serial = '123456';
  const password = 'test password';
  const changePassword = true;

  const response = await updateUserPassword(
    username,
    serial,
    password,
    changePassword
  );

  expect(response).toEqual('test response');
  expect(mockAxios.post).toHaveBeenCalledTimes(1);
  expect(mockAxios.post).toHaveBeenCalledWith(USERS_ENDPOINT, {
    username,
    serial,
    password,
    changePassword,
  });
});
