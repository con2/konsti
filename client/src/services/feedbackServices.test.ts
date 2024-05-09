import { expect, test, vi } from "vitest";
import { postFeedback } from "client/services/feedbackServices";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { api } from "client/utils/api";

test("POST feedback to server", async () => {
  const spy = vi
    .spyOn(api, "post")
    .mockResolvedValue({ data: "test response" });

  const feedback = "test feedback";
  const programItemId = "123";

  const response = await postFeedback(programItemId, feedback);

  expect(response).toEqual("test response");
  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(ApiEndpoint.FEEDBACK, {
    feedback,
    programItemId,
  });
});
