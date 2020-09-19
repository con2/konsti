import axios from 'axios';
import { getResults } from '../resultsServices';

jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

describe('resultsServices', () => {
  it('GET results from server', async () => {
    mockAxios.get.mockImplementation(
      async () =>
        await Promise.resolve({
          status: 200,
          data: 'test response',
        })
    );

    const startTime = '2019-07-26T13:00:00Z';

    const response = await getResults(startTime);

    expect(response).toEqual('test response');
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledWith(`/results`, {
      params: { startTime },
    });
  });
});
