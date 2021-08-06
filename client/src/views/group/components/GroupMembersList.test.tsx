import React from "react";
import { render } from "@testing-library/react";
import {
  GroupMembersList,
  Props,
} from "client/views/group/components/GroupMembersList";

test("should render correctly", () => {
  const props: Props = { groupMembers: [] };

  render(<GroupMembersList {...props} />);
});
