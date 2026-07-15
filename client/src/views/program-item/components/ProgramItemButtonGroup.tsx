import { ReactElement, ReactNode } from "react";
import styled from "styled-components";
import { ButtonGroup } from "client/components/ButtonGroup";
import { programItemContentMargin } from "client/views/my-program-items/components/shared";

interface Props {
  children: ReactNode;
}

// Centered action row in a program item card
export const ProgramItemButtonGroup = ({ children }: Props): ReactElement => (
  <Container>{children}</Container>
);

const Container = styled(ButtonGroup)`
  ${programItemContentMargin};
  justify-content: center;

  @media (max-width: ${(props) => props.theme.breakpointDesktop}) {
    flex-direction: column;
  }
`;
