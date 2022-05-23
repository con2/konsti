import React from "react";
import { Provider } from "react-redux";
import { render } from "@testing-library/react";
import { store } from "client/utils/store";
import { GameDetails } from "client/views/all-games/components/GameDetails";

jest.mock("react-router-dom", () => ({
  useNavigate: () => {},
  useParams: () => {
    return {
      gameId: "1234",
    };
  },
}));

// eslint-disable-next-line jest/no-disabled-tests
test.skip("should render correctly", () => {
  render(
    <Provider store={store}>
      <GameDetails />
    </Provider>
  );
});
