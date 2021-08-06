import React from "react";
import { Provider } from "react-redux";
import { render } from "@testing-library/react";
import { store } from "client/utils/store";
import { GroupView } from "client/views/group/GroupView";

test("should render correctly", () => {
  render(
    <Provider store={store}>
      <GroupView />
    </Provider>
  );
});
