import { expect, test } from "@playwright/test";

// robots.txt must be reachable at the site root, where crawlers look for it.
// It is served from the client's publicDir, which the build copies to the
// output root - a build change that moved it under assets/ would break this
test("robots.txt is served from the site root", async ({ request }) => {
  const response = await request.get("/robots.txt");

  expect(response.status()).toEqual(200);
  expect(await response.text()).toContain("User-agent");
});
