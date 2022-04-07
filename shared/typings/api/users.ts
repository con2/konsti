import { SelectedGame } from "shared/typings/models/user";

export interface GetUserResponse {
  games: UserGames;
  message: string;
  serial: string;
  status: "success";
  username: string;
}

export interface PostUserResponse {
  message: string;
  password: string;
  status: "success";
  username: string;
}

export interface GetUserBySerialResponse {
  message: string;
  serial: string;
  status: "success";
  username: string;
}

export interface UserGames {
  enteredGames: readonly SelectedGame[];
  favoritedGames: readonly string[];
  signedGames: readonly SelectedGame[];
}
