import { z } from "zod";
import { ApiError, ApiResult } from "shared/typings/api/errors";
import { GroupMember } from "shared/typings/models/groups";

// POST: Create group

export const PostCreateGroupRequestSchema = z.object({
  groupCode: z.string(),
});

export type PostCreateGroupRequest = z.infer<
  typeof PostCreateGroupRequestSchema
>;

export interface PostCreateGroupResponse extends ApiResult {
  groupCode: string;
}

export interface PostCreateGroupError extends ApiError {
  errorId: "unknown" | "groupExists" | "userHasSignedGames";
}

// POST: Join group

export const PostJoinGroupRequestSchema = z.object({
  groupCode: z.string(),
  ownSerial: z.string(),
});

export type PostJoinGroupRequest = z.infer<typeof PostJoinGroupRequestSchema>;

export type PostJoinGroupResponse = PostCreateGroupResponse;

export interface PostJoinGroupError extends ApiError {
  errorId:
    | "unknown"
    | "cannotJoinOwnGroup"
    | "invalidGroupCode"
    | "groupDoesNotExist"
    | "removePreviousSignupsFailed"
    | "userHasSignedGames";
}

// POST: Leave group

export type PostLeaveGroupResponse = PostCreateGroupResponse;

export interface PostLeaveGroupError extends ApiError {
  errorId: "unknown" | "failedToLeave";
}

// POST: Close group

export const PostCloseGroupRequestSchema = z.object({
  groupCode: z.string(),
});

export type PostCloseGroupRequest = z.infer<typeof PostCloseGroupRequestSchema>;

export type PostCloseGroupResponse = PostCreateGroupResponse;

export interface PostCloseGroupError extends ApiError {
  errorId: "unknown" | "onlyCreatorCanCloseGroup";
}

// GET group

export const GetGroupRequestSchema = z.object({
  groupCode: z.string(),
});

export type GetGroupRequest = z.infer<typeof GetGroupRequestSchema>;

export interface GetGroupResponse extends ApiResult {
  results: GroupMember[];
}

export interface GetGroupError extends ApiError {
  errorId: "unknown";
}
