import { api } from "client/utils/api";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  DeleteEnteredGameError,
  DeleteEnteredGameRequest,
  DeleteEnteredGameResponse,
  PostEnteredGameError,
  PostEnteredGameRequest,
  PostEnteredGameResponse,
  PostSignedGamesError,
  PostSignedGamesRequest,
  PostSignedGamesResponse,
} from "shared/typings/api/myGames";

export const postSignedGames = async (
  signupData: PostSignedGamesRequest,
): Promise<PostSignedGamesResponse | PostSignedGamesError> => {
  const response = await api.post<
    PostSignedGamesResponse,
    PostSignedGamesRequest
  >(ApiEndpoint.SIGNED_GAME, signupData);
  return response.data;
};

export const postEnteredGame = async (
  requestData: PostEnteredGameRequest,
): Promise<PostEnteredGameResponse | PostEnteredGameError> => {
  const response = await api.post<
    PostEnteredGameResponse,
    PostEnteredGameRequest
  >(ApiEndpoint.SIGNUP, requestData);
  return response.data;
};

export const deleteEnteredGame = async (
  requestData: DeleteEnteredGameRequest,
): Promise<DeleteEnteredGameResponse | DeleteEnteredGameError> => {
  const response = await api.delete<
    DeleteEnteredGameResponse,
    DeleteEnteredGameRequest
  >(ApiEndpoint.SIGNUP, { data: requestData });
  return response.data;
};
