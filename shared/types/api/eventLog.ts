import { z } from "zod";
import { EventLogAction, EventLogItem } from "shared/types/models/eventLog";
import { ApiError, ApiResult } from "shared/types/api/errors";

// POST event log item

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PostEventLogItemRequestSchema = z.object({
  updates: z.array(
    z.object({
      username: z.string(),
      programItemId: z.string(),
      programItemStartTime: z.string(),
      createdAt: z.string(), // TODO: Should this be date?
    }),
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
