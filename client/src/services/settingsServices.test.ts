import { expect, test, vi } from "vitest";
import { getSettings, postSettings } from "client/services/settingsServices";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { api } from "client/utils/api";

test("GET settings from server", async () => {
  const spy = vi.spyOn(api, "get").mockResolvedValue("");

  await getSettings();

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(ApiEndpoint.SETTINGS);
});

test("POST setting to server", async () => {
  const spy = vi.spyOn(api, "post").mockResolvedValue("");
  const appOpen = true;

  await postSettings({ appOpen });

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(ApiEndpoint.SETTINGS, {
    appOpen,
  });
});
