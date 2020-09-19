import axios from 'axios';
import { getSettings, postToggleAppOpen } from '../settingsServices';

jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

describe('settingsServices', () => {
  it('GET settings from server', async () => {
    mockAxios.get.mockImplementation(
      async () =>
        await Promise.resolve({
          status: 200,
          data: 'test response',
        })
    );

    const response = await getSettings();

    expect(response).toEqual('test response');
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledWith(`/settings`);
  });

  it('POST appOpen setting to server', async () => {
    mockAxios.post.mockImplementation(async () => {
      return await Promise.resolve({
        status: 200,
        data: 'test response',
      });
    });

    const appOpen = true;

    const response = await postToggleAppOpen(appOpen);

    expect(response).toEqual('test response');
    expect(mockAxios.post).toHaveBeenCalledTimes(1);
    expect(mockAxios.post).toHaveBeenCalledWith(`/toggle-app-open`, {
      appOpen,
    });
  });
});
