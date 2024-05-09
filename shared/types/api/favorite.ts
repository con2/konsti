import { z } from "zod";
import { ProgramItem } from "shared/types/models/programItem";
import { ApiResult } from "shared/types/api/errors";

// POST favorite

export const PostFavoriteRequestSchema = z.object({
  favoritedGameIds: z.array(z.string()),
});

export type PostFavoriteRequest = z.infer<typeof PostFavoriteRequestSchema>;

export interface PostFavoriteResponse extends ApiResult {
  favoritedGames: readonly ProgramItem[];
}
