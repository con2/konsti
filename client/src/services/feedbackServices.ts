import { AxiosResponse, AxiosError } from 'axios';
import { api } from 'client/utils/api';
import {
  Feedback,
  PostFeedbackResponse,
} from 'client/typings/feedback.typings';
import { ServerError } from 'client/typings/utils.typings';

export const postFeedback = async (
  feedbackData: Feedback
): Promise<PostFeedbackResponse | ServerError> => {
  let response: AxiosResponse;
  try {
    response = await api.post<PostFeedbackResponse>('/feedback', {
      feedbackData,
    });
  } catch (error) {
    if (error?.response) {
      const axiosError: AxiosError<ServerError> = error;
      if (axiosError.response) return axiosError.response.data;
    }
    throw error;
  }

  return response.data;
};
