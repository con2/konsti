import { expect, APIRequestContext } from "@playwright/test";

export const populateDb = async (request: APIRequestContext): Promise<void> => {
  const url = `${process.env.PLAYWRIGHT_BASEURL}/api/populate-db`;
  const response = await request.post(url);
  expect(response.status()).toBe(200);
};
