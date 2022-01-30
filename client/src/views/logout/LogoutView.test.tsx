import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { render } from "@testing-library/react";
import { store } from "client/utils/store";
import { LogoutView } from "client/views/logout/LogoutView";

// Does not work with react-router v6
// eslint-disable-next-line jest/no-disabled-tests
test.skip("should render correctly", () => {
  render(
    <Provider store={store}>
      <BrowserRouter>
        <LogoutView />
      </BrowserRouter>
    </Provider>
  );
});
