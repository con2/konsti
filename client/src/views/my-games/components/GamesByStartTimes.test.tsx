import React from "react";
import { act, render } from "@testing-library/react";
import { Provider } from "react-redux";
import { store } from "client/utils/store";
import {
  GamesByStartTimes,
  Props,
} from "client/views/my-games/components/GamesByStartTimes";

test("should render correctly", async () => {
  const props: Props = { games: [], startTimes: [] };
  await act(async () => {
    await render(
      <Provider store={store}>
        <GamesByStartTimes {...props} />
      </Provider>
    );
  });
});
