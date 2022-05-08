import { expect, APIRequestContext } from "@playwright/test";

export const populateDb = async (request: APIRequestContext): Promise<void> => {
  const url = `${
    process.env.PLAYWRIGHT_BASEURL ?? `http://localhost:5000`
  }/api/populate-db`;
  const response = await request.post(url);
  expect(response.status()).toBe(200);
};
