import { findGameById } from "server/features/game/gameRepository";
import { getUsersForGame } from "server/features/game/gameUtils";
import {
  delEnteredGame,
  saveEnteredGame,
} from "server/features/user/entered-game/enteredGameRepository";
import { findUsers } from "server/features/user/userRepository";
import { ApiError } from "shared/typings/api/errors";
import {
  DeleteEnteredGameParameters,
  DeleteEnteredGameResponse,
  PostEnteredGameError,
  PostEnteredGameParameters,
  PostEnteredGameResponse,
} from "shared/typings/api/myGames";

export const storeEnteredGame = async (
  enteredGameRequest: PostEnteredGameParameters
): Promise<PostEnteredGameResponse | PostEnteredGameError> => {
  let game;
  try {
    game = await findGameById(enteredGameRequest.enteredGameId);
    if (!game) throw new Error("Entered game not found");
  } catch (error) {
    return {
      message: `Entered game not found`,
      status: "error",
      errorId: "unknown",
    };
  }

  let usersForGame;
  try {
    const users = await findUsers();
    usersForGame = await getUsersForGame(
      users,
      enteredGameRequest.enteredGameId
    );
  } catch (error) {
    return {
      message: `Error counting users for game`,
      status: "error",
      errorId: "unknown",
    };
  }

  if (usersForGame.length >= game.maxAttendance) {
    return {
      message: `Entered game is full`,
      status: "error",
      errorId: "gameFull",
    };
  }

  let user;
  try {
    user = await saveEnteredGame(enteredGameRequest);
  } catch (error) {
    return {
      message: `Store entered game failure: ${error}`,
      status: "error",
      errorId: "unknown",
    };
  }

  const newEnteredGame = user.enteredGames.find(
    (enteredGame) =>
      enteredGame.gameDetails.gameId === enteredGameRequest.enteredGameId
  );

  if (user && newEnteredGame) {
    return {
      message: "Store entered game success",
      status: "success",
      enteredGame: newEnteredGame,
    };
  }

  return {
    message: "Store entered game failure",
    status: "error",
    errorId: "unknown",
  };
};

export const removeEnteredGame = async (
  enteredGameRequest: DeleteEnteredGameParameters
): Promise<DeleteEnteredGameResponse | ApiError> => {
  let user;
  try {
    user = await delEnteredGame(enteredGameRequest);
  } catch (error) {
    return {
      message: "Delete entered game failure",
      status: "error",
      errorId: "unknown",
    };
  }

  if (user) {
    return {
      message: "Delete entered game success",
      status: "success",
    };
  }

  return {
    message: "Delete entered game failure",
    status: "error",
    errorId: "unknown",
  };
};
