import { z } from "zod";
import { ApiError, ApiResult } from "shared/types/api/errors";
import { GroupMember } from "shared/types/models/groups";

// POST: Create group

export interface PostCreateGroupResult extends ApiResult {
  groupCode: string;
}

export interface PostCreateGroupError extends ApiError {
  errorId:
    | "unknown"
    | "groupExists"
    | "upcomingDirectSignups"
    | "errorFindingUser";
}

export type PostCreateGroupResponse =
  | PostCreateGroupResult
  | PostCreateGroupError;

// POST: Join group

export const PostJoinGroupRequestSchema = z.object({
  groupCode: z.string(),
});

export type PostJoinGroupRequest = z.infer<typeof PostJoinGroupRequestSchema>;

export type PostJoinGroupResult = PostCreateGroupResult;

export interface PostJoinGroupError extends ApiError {
  errorId:
    | "unknown"
    | "alreadyInGroup"
    | "invalidGroupCode"
    | "groupDoesNotExist"
    | "removeUpcomingLotterySignupsFailed"
    | "upcomingDirectSignups"
    | "errorFindingUser";
}

export type PostJoinGroupResponse = PostJoinGroupResult | PostJoinGroupError;

// POST: Leave group

export type PostLeaveGroupResult = PostCreateGroupResult;

export interface PostLeaveGroupError extends ApiError {
  errorId: "unknown" | "failedToLeave";
}

export type PostLeaveGroupResponse = PostLeaveGroupResult | PostLeaveGroupError;

// POST: Close group

export const PostCloseGroupRequestSchema = z.object({
  groupCode: z.string(),
});

export type PostCloseGroupRequest = z.infer<typeof PostCloseGroupRequestSchema>;

export type PostCloseGroupResult = PostCreateGroupResult;

export interface PostCloseGroupError extends ApiError {
  errorId: "unknown" | "onlyCreatorCanCloseGroup";
}

export type PostCloseGroupResponse = PostCloseGroupResult | PostCloseGroupError;

// GET group

export const GetGroupRequestSchema = z.object({
  groupCode: z.string(),
});

export type GetGroupRequest = z.infer<typeof GetGroupRequestSchema>;

export interface GetGroupResult extends ApiResult {
  results: GroupMember[];
}

export interface GetGroupError extends ApiError {
  errorId: "unknown";
}

export type GetGroupResponse = GetGroupResult | GetGroupError;
