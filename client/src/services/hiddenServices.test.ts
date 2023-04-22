import { expect, test, vi } from "vitest";
import { Game } from "shared/typings/models/game";
import { postHidden } from "client/services/hiddenServices";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { api } from "client/utils/api";

test("POST hidden games to server", async () => {
  const spy = vi.spyOn(api, "post").mockResolvedValue("");
  const hiddenData: Game[] = [];

  await postHidden(hiddenData);

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(ApiEndpoint.HIDDEN, {
    hiddenData,
  });
});
