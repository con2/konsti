import React from "react";
import { render } from "@testing-library/react";
import {
  MySignupsList,
  Props,
} from "client/views/my-games/components/MySignupsList";

test("should render correctly", () => {
  const props: Props = { signedGames: [], isGroupCreator: false };

  render(<MySignupsList {...props} />);
});
