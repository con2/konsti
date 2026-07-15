import { ComponentProps, ReactElement } from "react";
import styled from "styled-components";
import { Button } from "client/components/Button";

// Wide action button in a program item card
export const ProgramItemButton = (
  props: ComponentProps<typeof Button>,
): ReactElement => <StyledButton {...props} />;

const StyledButton = styled(Button)`
  min-width: 400px;

  @media (max-width: ${(props) => props.theme.breakpointDesktop}) {
    width: 100%;
    min-width: 0;
  }
`;
