import React from "react";
import { Provider } from "react-redux";
import { render } from "@testing-library/react";
import { store } from "client/utils/store";
import { AdminView } from "client/views/admin/AdminView";

test("should render correctly", () => {
  render(
    <Provider store={store}>
      <AdminView />
    </Provider>
  );
});
