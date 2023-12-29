import { expect, APIRequestContext } from "@playwright/test";
import { ApiEndpoint } from "shared/constants/apiEndpoints";

const baseUrl = process.env.PLAYWRIGHT_BASEURL ?? `http://localhost:5000`;

export const populateDb = async (request: APIRequestContext): Promise<void> => {
  const url = `${baseUrl}${ApiEndpoint.POPULATE_DB}`;
  const response = await request.post(url);
  expect(response.status()).toBe(200);
};

export const logTestStart = (testName: string): void => {
  console.log(`Start test: ${testName}`); // eslint-disable-line no-console
};
