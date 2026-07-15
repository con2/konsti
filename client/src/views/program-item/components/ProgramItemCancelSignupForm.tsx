import { ComponentProps, ReactElement } from "react";
import styled from "styled-components";
import { CancelSignupForm } from "client/views/program-item/signup/components/CancelSignupForm";
import { programItemContentMargin } from "client/views/my-program-items/components/shared";

// Match the margins of the button row this replaces, so opening the
// cancellation confirmation doesn't shift the card layout
export const ProgramItemCancelSignupForm = (
  props: ComponentProps<typeof CancelSignupForm>,
): ReactElement => <StyledCancelSignupForm {...props} />;

const StyledCancelSignupForm = styled(CancelSignupForm)`
  ${programItemContentMargin};
`;
