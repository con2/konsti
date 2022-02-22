import { postTestSettings } from "client/test/test-settings/testSettingsServices";
import { submitSetTestTime } from "client/test/test-settings/testSettingsSlice";
import { AppThunk } from "client/typings/redux.typings";

export const submitSetTestSettings = ({
  testTime,
}: {
  testTime: string;
}): AppThunk => {
  return async (dispatch): Promise<void> => {
    const response = await postTestSettings({
      testTime,
    });

    if (response?.status === "error") {
      return await Promise.reject(response);
    }

    if (response?.status === "success") {
      dispatch(submitSetTestTime(response.testSettings.testTime));
    }
  };
};
