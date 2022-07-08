import { z } from "zod";
import { SelectedGame } from "shared/typings/models/user";
import { ApiError } from "shared/typings/api/errors";

export interface PostGroupResponse {
  groupCode: string;
  message: string;
  status: "success";
}

export interface PostCreateGroupError extends ApiError {
  errorId: "unknown" | "groupExists";
}

export interface PostJoinGroupError extends ApiError {
  errorId:
    | "unknown"
    | "cannotJoinOwnGroup"
    | "invalidGroupCode"
    | "groupDoesNotExist"
    | "removePreviousSignupsFailed"
    | "userHasSignedGames";
}

export interface PostLeaveGroupError extends ApiError {
  errorId: "unknown" | "failedToLeave";
}

export interface PostCloseGroupError extends ApiError {
  errorId: "unknown" | "onlyCreatorCanCloseGroup";
}

export interface GetGroupResponse {
  message: string;
  results: GroupMember[];
  status: "success";
}

export interface GetGroupError extends ApiError {
  errorId: "unknown";
}

export const CreateGroupRequestSchema = z.object({
  groupCode: z.string(),
  username: z.string(),
});

export type CreateGroupRequest = z.infer<typeof CreateGroupRequestSchema>;

export const JoinGroupRequestSchema = z.object({
  groupCode: z.string(),
  ownSerial: z.string(),
  username: z.string(),
});

export type JoinGroupRequest = z.infer<typeof JoinGroupRequestSchema>;

export const LeaveGroupRequestSchema = z.object({
  username: z.string(),
});

export type LeaveGroupRequest = z.infer<typeof LeaveGroupRequestSchema>;

export const CloseGroupRequestSchema = z.object({
  groupCode: z.string(),
  username: z.string(),
});

export type CloseGroupRequest = z.infer<typeof CloseGroupRequestSchema>;

export interface GroupMember {
  groupCode: string;
  serial: string;
  signedGames: readonly SelectedGame[];
  username: string;
}
