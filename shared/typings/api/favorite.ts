export interface PostFavoriteResponse {
  favoritedGames: readonly string[];
  message: string;
  status: "success";
}

export interface SaveFavoriteRequest {
  username: string;
  favoritedGames: readonly string[];
}
