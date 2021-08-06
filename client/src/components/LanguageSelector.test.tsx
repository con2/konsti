import React from "react";
import { render } from "@testing-library/react";
import { LanguageSelector } from "client/components/LanguageSelector";

test("should render correctly", () => {
  render(<LanguageSelector />);
});
