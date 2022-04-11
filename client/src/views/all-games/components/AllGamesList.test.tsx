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
