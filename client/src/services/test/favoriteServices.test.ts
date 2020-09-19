import axios from 'axios';
import { postFavorite } from '../favoriteServices';

jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

describe('favoriteServices', () => {
  it('POST favorited games to server', async () => {
    mockAxios.post.mockImplementation(async () => {
      return await Promise.resolve({
        status: 200,
        data: 'test response',
      });
    });

    const favoriteData = {
      username: 'test username',
      favoritedGames: [],
    };

    const response = await postFavorite(favoriteData);

    expect(response).toEqual('test response');
    expect(mockAxios.post).toHaveBeenCalledTimes(1);
    expect(mockAxios.post).toHaveBeenCalledWith(`/favorite`, { favoriteData });
  });
});
