import { Request, Response } from "express";
import { PostAssignmentRequestSchema } from "shared/types/api/assignment";
import { UserGroup } from "shared/types/models/user";
import { getAuthorizedUsername } from "server/utils/authHeader";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { storeAssignment } from "server/features/assignment/assignmentService";

export const postAssignment = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.ASSIGNMENT}`);

  const username = getAuthorizedUsername(
    req.headers.authorization,
    UserGroup.ADMIN,
  );
  if (!username) {
    return res.sendStatus(401);
  }

  const result = PostAssignmentRequestSchema.safeParse(req.body);
  if (!result.success) {
    logger.error(
      "Parsing postAssignment() request body failed: %s",
      result.error,
    );
    return res.sendStatus(422);
  }

  const response = await storeAssignment(result.data.startTime);
  return res.json(response);
};
