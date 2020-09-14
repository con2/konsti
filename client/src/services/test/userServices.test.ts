import axios from 'axios';
import {
  postRegistration,
  getUser,
  getUserBySerial,
  updateUserPassword,
} from '../userServices';

jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

describe('userServices', () => {
  it('GET user from server', async () => {
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
    expect(mockAxios.get).toHaveBeenCalledWith(`/user`, {
      params: { username },
    });
  });

  it('GET user by serial from server', async () => {
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
    expect(mockAxios.get).toHaveBeenCalledWith(`/user`, {
      params: { serial },
    });
  });

  it('POST registration to server', async () => {
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
    expect(mockAxios.post).toHaveBeenCalledWith(`/user`, {
      username,
      password,
      serial,
    });
  });

  it('POST new user password to server', async () => {
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
    expect(mockAxios.post).toHaveBeenCalledWith(`/user`, {
      username,
      serial,
      password,
      changePassword,
    });
  });
});
