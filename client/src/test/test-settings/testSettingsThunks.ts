import {
  getTestSettings,
  postTestSettings,
} from "client/test/test-settings/testSettingsServices";
import { submitSetTestTime } from "client/test/test-settings/testSettingsSlice";
import { AppThunk } from "client/types/reduxTypes";
import { loadProgramItems } from "client/utils/loadData";

export const submitGetTestSettings = (): AppThunk => {
  return async (dispatch): Promise<void> => {
    const response = await getTestSettings();

    if (response.status === "error") {
      return;
    }

    dispatch(submitSetTestTime(response.testSettings.testTime));
  };
};

export const submitSetTestSettings = ({
  testTime,
}: {
  testTime: string;
}): AppThunk => {
  return async (dispatch): Promise<void> => {
    const response = await postTestSettings({
      testTime,
    });

    if (response.status === "error") {
      return;
    }

    dispatch(submitSetTestTime(response.testSettings.testTime));

    // Force rerender of memoized program items list
    await loadProgramItems({ forceUpdate: true });
  };
};
