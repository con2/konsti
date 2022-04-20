import { Game } from "shared/typings/models/game";

export interface PostFavoriteResponse {
  favoritedGames: readonly Game[];
  message: string;
  status: "success";
}

export interface SaveFavoriteRequest {
  username: string;
  favoritedGameIds: readonly string[];
}
