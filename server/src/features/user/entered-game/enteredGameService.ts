import {
  delEnteredGame,
  saveEnteredGame,
} from 'server/features/user/userRepository';
import { ServerError } from 'shared/typings/api/errors';
import {
  DeleteEnteredGameParameters,
  DeleteEnteredGameResponse,
  PostEnteredGameParameters,
  PostEnteredGameResponse,
} from 'shared/typings/api/signup';

export const storeEnteredGame = async (
  enteredGameRequest: PostEnteredGameParameters
): Promise<PostEnteredGameResponse | ServerError> => {
  let user;
  try {
    user = await saveEnteredGame(enteredGameRequest);
  } catch (error) {
    return {
      message: `Store entered game failure: ${error}`,
      status: 'error',
      code: 0,
    };
  }

  if (user) {
    return {
      message: 'Store entered game success',
      status: 'success',
    };
  }

  return {
    message: 'Store entered game failure',
    status: 'error',
    code: 0,
  };
};

export const removeEnteredGame = async (
  enteredGameRequest: DeleteEnteredGameParameters
): Promise<DeleteEnteredGameResponse | ServerError> => {
  let user;
  try {
    user = await delEnteredGame(enteredGameRequest);
  } catch (error) {
    return {
      message: 'Delete entered game failure',
      status: 'error',
      code: 0,
    };
  }

  if (user) {
    return {
      message: 'Delete entered game success',
      status: 'success',
    };
  }

  return {
    message: 'Delete entered game failure',
    status: 'error',
    code: 0,
  };
};
