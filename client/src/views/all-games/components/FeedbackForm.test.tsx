import React from "react";
import { Provider } from "react-redux";
import { render } from "@testing-library/react";
import { testGame } from "client/test/test-data/testGame";
import {
  FeedbackForm,
  Props,
} from "client/views/all-games/components/FeedbackForm";
import { store } from "client/utils/store";

test("should render correctly", () => {
  const props: Props = { game: testGame };

  render(
    <Provider store={store}>
      <FeedbackForm {...props} />
    </Provider>
  );
});
