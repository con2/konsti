import React from "react";
import { Provider } from "react-redux";
import { render } from "@testing-library/react";
import { store } from "client/utils/store";
import {
  DragAndDropList,
  Props,
} from "client/views/signup/components/DragAndDropList";

test("should render correctly", () => {
  const props: Props = {
    updateSelectedGames: () => {},
    availableGames: [],
    selectedGames: [],
  };

  render(
    <Provider store={store}>
      <DragAndDropList {...props} />
    </Provider>
  );
});
