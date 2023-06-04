import { z } from "zod";
import {
  ActionLogAction,
  ActionLogItem,
} from "shared/typings/models/actionLog";
import { ApiError, ApiResult } from "shared/typings/api/errors";

// POST action log item

const PostActionLogItemRequestSchema = z.object({
  updates: z.array(
    z.object({ username: z.string(), eventItemTitle: z.string() })
  ),
  action: z.nativeEnum(ActionLogAction),
});

export type PostActionLogItemRequest = z.infer<
  typeof PostActionLogItemRequestSchema
>;

// POST update action log item isSeen

export const PostActionLogIsSeenRequestSchema = z.object({
  username: z.string(),
  actionLogItemId: z.string(),
  isSeen: z.boolean(),
});

export type PostActionLogIsSeenRequest = z.infer<
  typeof PostActionLogIsSeenRequestSchema
>;

export interface PostActionLogIsSeenResponse extends ApiResult {
  actionLogItems: ActionLogItem[];
}

export interface PostActionLogIsSeenError extends ApiError {
  errorId: "unknown";
}
