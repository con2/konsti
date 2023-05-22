import { z } from "zod";
import { Game } from "shared/typings/models/game";

// POST favorite

export const PostFavoriteRequestSchema = z.object({
  username: z.string(),
  favoritedGameIds: z.array(z.string()),
});

export type PostFavoriteRequest = z.infer<typeof PostFavoriteRequestSchema>;

export interface PostFavoriteResponse {
  favoritedGames: readonly Game[];
  message: string;
  status: "success";
}
