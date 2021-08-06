import React from "react";
import { Provider } from "react-redux";
import { render } from "@testing-library/react";
import { store } from "client/utils/store";
import { HelperResultsList } from "client/views/helper/components/HelperResultsList";

test("should render correctly", () => {
  render(
    <Provider store={store}>
      <HelperResultsList />
    </Provider>
  );
});
