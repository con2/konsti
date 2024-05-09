import { expect, test, vi } from "vitest";
import { ProgramItem } from "shared/types/models/programItem";
import { postHidden } from "client/services/hiddenServices";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { api } from "client/utils/api";

test("POST hidden games to server", async () => {
  const spy = vi
    .spyOn(api, "post")
    .mockResolvedValue({ data: "test response" });
  const hiddenData: ProgramItem[] = [];

  const response = await postHidden(hiddenData);

  expect(response).toEqual("test response");
  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(ApiEndpoint.HIDDEN, {
    hiddenData,
  });
});
