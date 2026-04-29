import { Request, Response } from "express";
import { fetchSignupMessages } from "server/features/user/signup-message/signupMessageService";

export const getSignupMessages = async (
  _req: Request,
  res: Response,
): Promise<Response> => {
  const response = await fetchSignupMessages();
  return res.json(response);
};
