import { Request, Response } from "express";
import { PostLoginRequest } from "shared/types/api/login";
import { login } from "server/features/user/login/loginService";

export const postLogin = async (
  req: Request<unknown, unknown, PostLoginRequest>,
  res: Response,
): Promise<Response> => {
  const { username, password } = req.body;
  const response = await login(username, password);
  return res.json(response);
};
