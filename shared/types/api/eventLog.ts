import { z } from "zod";
import { EventLogAction, EventLogItem } from "shared/types/models/eventLog";
import { ApiError, ApiResult } from "shared/types/api/errors";

// New event log items

interface NewEventLogItem {
  username: string;
  programItemId: string;
  programItemStartTime: string;
  createdAt: string;
}

export interface NewEventLogItems {
  updates: NewEventLogItem[];
  action: EventLogAction;
}

// POST update event log item isSeen

export const PostEventLogIsSeenRequestSchema = z.object({
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
