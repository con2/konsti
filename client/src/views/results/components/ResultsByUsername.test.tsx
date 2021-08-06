import React from "react";
import { render } from "@testing-library/react";
import {
  ResultsByUsername,
  Props,
} from "client/views/results/components/ResultsByUsername";

test("should render correctly", () => {
  const props: Props = { results: [] };

  render(<ResultsByUsername {...props} />);
});
