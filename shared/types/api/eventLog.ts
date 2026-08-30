import { z } from "zod";
import { ApiError, ApiResult } from "shared/types/api/errors";
import { EventLogAction, EventLogItem } from "shared/types/models/eventLog";
import { ProgramType } from "shared/types/models/programItem";

// New event log items

export interface NewEventLogItem {
  username: string;
  programItemId: string;
  programItemStartTime: string;
  lastProgramItemEndTime?: string;
  programType?: ProgramType;
  createdAt: string;
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

export interface PostEventLogIsSeenResult extends ApiResult {
  eventLogItems: EventLogItem[];
}

interface PostEventLogIsSeenError extends ApiError {
  errorId: "unknown";
}

export type PostEventLogIsSeenResponse =
  | PostEventLogIsSeenResult
  | PostEventLogIsSeenError;
