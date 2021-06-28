import axios from 'axios';
import { postFeedback } from 'client/services/feedbackServices';
import { FEEDBACK_ENDPOINT } from 'shared/constants/apiEndpoints';

jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

test('POST feedback to server', async () => {
  mockAxios.post.mockImplementation(async () => {
    return await Promise.resolve({
      status: 200,
      data: 'test response',
    });
  });

  const feedback = 'test feedback';
  const gameId = '123';
  const username = 'test user';

  const response = await postFeedback({ feedback, gameId, username });

  expect(response).toEqual('test response');
  expect(mockAxios.post).toHaveBeenCalledTimes(1);
  expect(mockAxios.post).toHaveBeenCalledWith(FEEDBACK_ENDPOINT, {
    feedback,
    gameId,
    username,
  });
});
