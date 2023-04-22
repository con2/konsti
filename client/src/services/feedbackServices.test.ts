import { expect, test, vi } from "vitest";
import { postFeedback } from "client/services/feedbackServices";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { api } from "client/utils/api";

test("POST feedback to server", async () => {
  const spy = vi
    .spyOn(api, "post")
    .mockResolvedValue({ data: "test response" });

  const feedback = "test feedback";
  const gameId = "123";
  const username = "test user";

  const response = await postFeedback({ feedback, gameId, username });

  expect(response).toEqual("test response");
  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(ApiEndpoint.FEEDBACK, {
    feedback,
    gameId,
    username,
  });
});
