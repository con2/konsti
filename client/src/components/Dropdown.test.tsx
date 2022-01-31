import React from "react";
import { render } from "@testing-library/react";
import { Dropdown, Props } from "client/components/Dropdown";

test("should render correctly", () => {
  const props: Props = { items: [], onChange: () => {}, selectedValue: "" };

  render(<Dropdown {...props} />);
});
