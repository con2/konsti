import React from "react";
import { Provider } from "react-redux";
import { act, render } from "@testing-library/react";
import { store } from "client/utils/store";
import { AllGamesView } from "client/views/all-games/AllGamesView";
import * as loadData from "client/utils/loadData";

jest.spyOn(loadData, "loadGames").mockReturnValue(Promise.resolve());

test("should render correctly", async () => {
  await act(async () => {
    await render(
      <Provider store={store}>
        <AllGamesView />
      </Provider>
    );
  });
});
