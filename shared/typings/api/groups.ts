import { z } from "zod";
import { SelectedGame } from "shared/typings/models/user";
import { ApiError } from "shared/typings/api/errors";

export interface PostGroupResponse {
  groupCode: string;
  message: string;
  status: "success";
}

export interface PostGroupError extends ApiError {
  errorId:
    | "unknown"
    | "creatorCannotLeaveNonEmpty"
    | "groupUpdateFailed"
    | "groupExists"
    | "cannotJoinOwnGroup"
    | "invalidGroupCode"
    | "groupDoesNotExist";
}

export interface GetGroupResponse {
  message: string;
  results: GroupMember[];
  status: "success";
}

export const GroupRequestSchema = z.object({
  groupCode: z.string(),
  isGroupCreator: z.boolean(),
  ownSerial: z.string(),
  username: z.string(),
  leaveGroup: z.optional(z.boolean()),
  closeGroup: z.optional(z.boolean()),
});

export type GroupRequest = z.infer<typeof GroupRequestSchema>;

export interface GroupMember {
  enteredGames: readonly SelectedGame[];
  groupCode: string;
  serial: string;
  signedGames: readonly SelectedGame[];
  username: string;
}
