import axios from 'axios';
import { postHidden } from '../hiddenServices';
import { Game } from 'typings/game.typings';

jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

describe('hiddenServices', () => {
  it('POST hidden games to server', async () => {
    mockAxios.post.mockImplementation(async () => {
      return await Promise.resolve({
        status: 200,
        data: 'test response',
      });
    });

    const hiddenData: Game[] = [];

    const response = await postHidden(hiddenData);

    expect(response).toEqual('test response');
    expect(mockAxios.post).toHaveBeenCalledTimes(1);
    expect(mockAxios.post).toHaveBeenCalledWith(`/hidden`, { hiddenData });
  });
});
