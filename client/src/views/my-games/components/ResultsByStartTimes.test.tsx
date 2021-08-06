import React from "react";
import { act, render } from "@testing-library/react";
import { Provider } from "react-redux";
import {
  ResultsByStartTimes,
  Props,
} from "client/views/my-games/components/ResultsByStartTimes";
import { store } from "client/utils/store";

test("should render correctly", async () => {
  const props: Props = { signups: [], startTimes: [], missedSignups: [] };
  await act(async () => {
    await render(
      <Provider store={store}>
        <ResultsByStartTimes {...props} />
      </Provider>
    );
  });
});
