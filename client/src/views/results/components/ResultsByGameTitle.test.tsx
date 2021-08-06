import React from "react";
import { render } from "@testing-library/react";
import {
  ResultsByGameTitle,
  Props,
} from "client/views/results/components/ResultsByGameTitle";

test("should render correctly", () => {
  const props: Props = { results: [] };

  render(<ResultsByGameTitle {...props} />);
});
