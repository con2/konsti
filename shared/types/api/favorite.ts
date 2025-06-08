import { z } from "zod";
import { ApiError, ApiResult } from "shared/types/api/errors";
import { FavoriteProgramItemId } from "shared/types/models/user";

// POST favorite

export const PostFavoriteRequestSchema = z.object({
  favoriteProgramItemIds: z.array(z.string()),
});

export type PostFavoriteRequest = z.infer<typeof PostFavoriteRequestSchema>;

export interface PostFavoriteResponse extends ApiResult {
  favoriteProgramItemIds: readonly FavoriteProgramItemId[];
}

export interface PostFavoriteError extends ApiError {
  errorId: "unknown";
}
