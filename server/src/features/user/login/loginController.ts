import { Request, Response } from "express";
import { login } from "server/features/user/login/loginService";
import { PostLoginRequest } from "shared/types/api/login";

export const postLogin = async (
  req: Request<unknown, unknown, PostLoginRequest>,
  res: Response,
): Promise<Response> => {
  const { username, password } = req.body;
  const response = await login(username, password);
  return res.json(response);
};
