import axios from 'axios';
import { postGroup, getGroup } from '../groupServices';

jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

describe('groupServices', () => {
  it('GET group from server', async () => {
    mockAxios.get.mockImplementation(
      async () =>
        await Promise.resolve({
          status: 200,
          data: 'test response',
        })
    );

    const groupCode = '123';

    const response = await getGroup(groupCode);

    expect(response).toEqual('test response');
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledWith(`/group`, {
      params: { groupCode },
    });
  });

  it('POST group to server', async () => {
    mockAxios.post.mockImplementation(async () => {
      return await Promise.resolve({
        status: 200,
        data: 'test response',
      });
    });

    const groupData = {
      groupCode: '123',
      leader: true,
      ownSerial: '123',
      username: 'test user',
      leaveGroup: false,
      closeGroup: false,
    };

    const response = await postGroup(groupData);

    expect(response).toEqual('test response');
    expect(mockAxios.post).toHaveBeenCalledTimes(1);
    expect(mockAxios.post).toHaveBeenCalledWith(`/group`, { groupData });
  });
});
