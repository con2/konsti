import { Request, Response } from "express";

export const getHealthStatus = (_req: Request, res: Response): Response => {
  return res.sendStatus(200);
};
