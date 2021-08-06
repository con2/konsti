import { Game } from "shared/typings/models/game";
import { SelectedGame } from "shared/typings/models/user";

export interface SubmitGetUserPayload {
  enteredGames: readonly SelectedGame[];
  favoritedGames: readonly Game[];
  signedGames: readonly SelectedGame[];
}
