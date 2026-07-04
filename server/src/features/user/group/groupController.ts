import { Request, Response } from "express";
import {
  GetGroupRequest,
  PostCloseGroupRequest,
  PostJoinGroupRequest,
} from "shared/types/api/groups";
import { getAuthUsername } from "server/middleware/requireAuth";
import {
  closeGroup,
  createGroup,
  fetchGroup,
  joinGroup,
  leaveGroup,
} from "server/features/user/group/groupService";

export const postCreateGroup = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const response = await createGroup(getAuthUsername(req));
  return res.json(response);
};

export const postJoinGroup = async (
  req: Request<unknown, unknown, PostJoinGroupRequest>,
  res: Response,
): Promise<Response> => {
  const { groupCode } = req.body;
  const response = await joinGroup(getAuthUsername(req), groupCode);
  return res.json(response);
};

export const postLeaveGroup = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const response = await leaveGroup(getAuthUsername(req));
  return res.json(response);
};

export const postCloseGroup = async (
  req: Request<unknown, unknown, PostCloseGroupRequest>,
  res: Response,
): Promise<Response> => {
  const { groupCode } = req.body;
  const response = await closeGroup(groupCode, getAuthUsername(req));
  return res.json(response);
};

export const getGroup = async (
  req: Request<unknown, unknown, unknown, GetGroupRequest>,
  res: Response,
): Promise<Response> => {
  const { groupCode } = req.query;
  const response = await fetchGroup(groupCode, getAuthUsername(req));
  return res.json(response);
};
