import React from "react";
import { render } from "@testing-library/react";
import {
  SignupsByStartTimes,
  Props,
} from "client/views/my-games/components/SignupsByStartTimes";

test("should render correctly", () => {
  const props: Props = { signups: [], startTimes: [] };

  render(<SignupsByStartTimes {...props} />);
});
