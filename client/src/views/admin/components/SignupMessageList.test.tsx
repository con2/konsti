import React from "react";
import { render } from "@testing-library/react";
import {
  SignupMessageList,
  Props,
} from "client/views/admin/components/SignupMessageList";

test("should render correctly", () => {
  const props: Props = { signupMessages: [], games: [] };

  render(<SignupMessageList {...props} />);
});
