import { Request, Response } from "express";
import { getAuthorizedUserGroup } from "server/utils/authHeader";
import {
  fetchProgramItems,
  updateProgramItems,
} from "server/features/program-item/programItemService";

export const postUpdateProgramItems = async (
  _req: Request,
  res: Response,
): Promise<Response> => {
  const response = await updateProgramItems();
  return res.json(response);
};

export const getProgramItems = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const userGroup = getAuthorizedUserGroup(req.headers.authorization);
  const response = await fetchProgramItems(userGroup);
  return res.json(response);
};
