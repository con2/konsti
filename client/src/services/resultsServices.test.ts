import { expect, test, vi } from "vitest";
import { getResults } from "client/services/resultsServices";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { api } from "client/utils/api";

test("GET results from server", async () => {
  const spy = vi.spyOn(api, "get").mockResolvedValue({ data: "test response" });

  const startTime = "2019-07-26T13:00:00Z";

  const response = await getResults(startTime);

  expect(response).toEqual("test response");
  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(ApiEndpoint.RESULTS, {
    params: { startTime },
  });
});
