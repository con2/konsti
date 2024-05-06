import { expect, test, vi } from "vitest";
import { postLotterySignups } from "client/services/myGamesServices";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { api } from "client/utils/api";

test("POST lottery signups to server", async () => {
  const spy = vi
    .spyOn(api, "post")
    .mockResolvedValue({ data: "test response" });

  const signupData = {
    username: "test username",
    lotterySignups: [],
    startTime: "2019-07-26T13:00:00Z",
  };

  const response = await postLotterySignups(signupData);

  expect(response).toEqual("test response");
  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(ApiEndpoint.LOTTERY_SIGNUP, signupData);
});
