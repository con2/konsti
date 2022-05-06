import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { act, render } from "@testing-library/react";
import { store } from "client/utils/store";
import { AppRoutes } from "client/app/AppRoutes";
import * as loadData from "client/utils/loadData";

jest.spyOn(loadData, "loadGames").mockReturnValue(Promise.resolve());

jest.mock("@react-hook/intersection-observer", () => {
  return {
    __esModule: true,
    default: () => {
      return {
        time: null,
        rootBounds: null,
        boundingClientRect: null,
        intersectionRect: null,
        intersectionRatio: null,
        target: null,
        isIntersecting: false,
      };
    },
  };
});

test("should render correctly", async () => {
  await act(async () => {
    await render(
      <Provider store={store}>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </Provider>
    );
  });
});
