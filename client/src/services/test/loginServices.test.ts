import axios from 'axios';
import { postLogin } from '../loginServices';

jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

describe('loginServices', () => {
  it('POST login to server', async () => {
    mockAxios.post.mockImplementation(async () => {
      return await Promise.resolve({
        status: 200,
        data: 'test response',
      });
    });

    const username = 'test username';
    const password = 'test password';
    const jwt = 'test jwt';

    const loginData = {
      username,
      password,
      jwt,
    };

    const response = await postLogin(loginData);

    expect(response).toEqual('test response');
    expect(mockAxios.post).toHaveBeenCalledTimes(1);
    expect(mockAxios.post).toHaveBeenCalledWith(`/login`, {
      username,
      password,
      jwt,
    });
  });
});
