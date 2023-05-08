import { ApiError } from "shared/typings/api/errors";
import { Game } from "shared/typings/models/game";
import { SelectedGame } from "shared/typings/models/user";

export interface GetUserResponse {
  games: UserGames;
  message: string;
  serial: string;
  status: "success";
  username: string;
}

export interface PostUserRequest {
  username: string;
  password: string;
  serial?: string;
}

export interface PostUserResponse {
  message: string;
  password: string;
  status: "success";
  username: string;
}

export interface PostUserError extends ApiError {
  errorId: "unknown" | "invalidSerial" | "usernameNotFree";
}

export interface GetUserBySerialResponse {
  message: string;
  serial: string;
  status: "success";
  username: string;
}

export interface UserGames {
  enteredGames: readonly SelectedGame[];
  favoritedGames: readonly Game[];
  signedGames: readonly SelectedGame[];
}
