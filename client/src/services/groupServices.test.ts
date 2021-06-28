import axios from 'axios';
import { getGroup, postGroup } from 'client/services/groupServices';
import { GROUP_ENDPOINT } from 'shared/constants/apiEndpoints';

jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

test('GET group from server', async () => {
  mockAxios.get.mockImplementation(
    async () =>
      await Promise.resolve({
        status: 200,
        data: 'test response',
      })
  );

  const groupCode = '123';
  const username = 'test user';

  const response = await getGroup(groupCode, username);

  expect(response).toEqual('test response');
  expect(mockAxios.get).toHaveBeenCalledTimes(1);
  expect(mockAxios.get).toHaveBeenCalledWith(GROUP_ENDPOINT, {
    params: { groupCode, username },
  });
});

test('POST group to server', async () => {
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
  expect(mockAxios.post).toHaveBeenCalledWith(GROUP_ENDPOINT, { groupData });
});
