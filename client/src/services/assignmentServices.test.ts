import { expect, test, vi } from "vitest";
import { postAssignment } from "client/services/assignmentServices";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { api } from "client/utils/api";

test("POST assignment to server", async () => {
  const spy = vi
    .spyOn(api, "post")
    .mockResolvedValue({ data: "test response" });
  const startTime = "2019-07-26T13:00:00Z";

  const response = await postAssignment(startTime);

  expect(response).toEqual("test response");
  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(ApiEndpoint.ASSIGNMENT, {
    startTime,
  });
});
