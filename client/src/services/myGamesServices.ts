import { api } from "client/utils/api";
import { ApiError } from "shared/typings/api/errors";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  DeleteEnteredGameParameters,
  DeleteEnteredGameResponse,
  PostEnteredGameError,
  PostEnteredGameParameters,
  PostEnteredGameResponse,
  PostSignedGamesError,
  PostSignedGamesResponse,
  SignupData,
} from "shared/typings/api/myGames";

export const postSignedGames = async (
  signupData: SignupData
): Promise<PostSignedGamesResponse | PostSignedGamesError> => {
  const response = await api.post<PostSignedGamesResponse>(
    ApiEndpoint.SIGNED_GAME,
    {
      signupData,
    }
  );
  return response.data;
};

export const postEnteredGame = async (
  requestData: PostEnteredGameParameters
): Promise<PostEnteredGameResponse | PostEnteredGameError> => {
  const response = await api.post<PostEnteredGameResponse>(
    ApiEndpoint.ENTERED_GAME,
    requestData
  );
  return response.data;
};

export const deleteEnteredGame = async (
  requestData: DeleteEnteredGameParameters
): Promise<DeleteEnteredGameResponse | ApiError> => {
  const response = await api.delete<DeleteEnteredGameResponse>(
    ApiEndpoint.ENTERED_GAME,
    { data: requestData }
  );
  return response.data;
};
