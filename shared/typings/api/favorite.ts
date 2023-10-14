import { z } from "zod";
import { Game } from "shared/typings/models/game";
import { ApiResult } from "shared/typings/api/errors";

// POST favorite

export const PostFavoriteRequestSchema = z.object({
  favoritedGameIds: z.array(z.string()),
});

export type PostFavoriteRequest = z.infer<typeof PostFavoriteRequestSchema>;

export interface PostFavoriteResponse extends ApiResult {
  favoritedGames: readonly Game[];
}
