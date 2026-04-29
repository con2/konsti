import { Request, Response } from "express";
import { PostAssignmentRequest } from "shared/types/api/assignment";
import { storeAssignment } from "server/features/assignment/assignmentService";

export const postAssignment = async (
  req: Request<unknown, unknown, PostAssignmentRequest>,
  res: Response,
): Promise<Response> => {
  const response = await storeAssignment(req.body.assignmentTime);
  return res.json(response);
};
