import { z } from "zod";
import { EventLogAction, EventLogItem } from "shared/typings/models/eventLog";
import { ApiError, ApiResult } from "shared/typings/api/errors";

// POST event log item

const PostEventLogItemRequestSchema = z.object({
  updates: z.array(
    z.object({ username: z.string(), eventItemTitle: z.string() })
  ),
  action: z.nativeEnum(EventLogAction),
});

export type PostEventLogItemRequest = z.infer<
  typeof PostEventLogItemRequestSchema
>;

// POST update event log item isSeen

export const PostEventLogIsSeenRequestSchema = z.object({
  username: z.string(),
  eventLogItemId: z.string(),
  isSeen: z.boolean(),
});

export type PostEventLogIsSeenRequest = z.infer<
  typeof PostEventLogIsSeenRequestSchema
>;

export interface PostEventLogIsSeenResponse extends ApiResult {
  eventLogItems: EventLogItem[];
}

export interface PostEventLogIsSeenError extends ApiError {
  errorId: "unknown";
}
