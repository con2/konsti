import { expect, test, vi } from "vitest";
import { getResults } from "client/services/resultsServices";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { api } from "client/utils/api";

test("GET results from server", async () => {
  const spy = vi.spyOn(api, "get").mockResolvedValue("");

  const startTime = "2019-07-26T13:00:00Z";

  await getResults(startTime);

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(ApiEndpoint.RESULTS, {
    params: { startTime },
  });
});
