import React from "react";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { store } from "client/utils/store";
import { testGame } from "shared/tests/testGame";
import {
  AllGamesList,
  Props,
} from "client/views/all-games/components/AllGamesList";

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

test("should render correctly", () => {
  const props: Props = {
    games: [testGame],
  };

  render(
    <Provider store={store}>
      <BrowserRouter>
        <AllGamesList {...props} />
      </BrowserRouter>
    </Provider>
  );
});
