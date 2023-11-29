import { expect, test, vi } from "vitest";
import { Game } from "shared/types/models/game";
import { postHidden } from "client/services/hiddenServices";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { api } from "client/utils/api";

test("POST hidden games to server", async () => {
  const spy = vi
    .spyOn(api, "post")
    .mockResolvedValue({ data: "test response" });
  const hiddenData: Game[] = [];

  const response = await postHidden(hiddenData);

  expect(response).toEqual("test response");
  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(ApiEndpoint.HIDDEN, {
    hiddenData,
  });
});
