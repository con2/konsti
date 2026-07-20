import { Request, Response } from "express";
import { fetchResults } from "server/features/results/resultsService";

export const getResults = async (
  _req: Request,
  res: Response,
): Promise<Response> => {
  const response = await fetchResults();
  return res.json(response);
};
