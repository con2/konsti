import { ReactElement, ReactNode } from "react";
import styled from "styled-components";
import { programItemCardEndMargin } from "client/views/my-program-items/components/shared";

interface Props {
  children: ReactNode;
  "data-testid"?: string;
}

// Bold status text ending a program item card (e.g. full, cancelled)
export const ProgramItemStatusMessage = ({
  children,
  "data-testid": dataTestId,
}: Props): ReactElement => (
  <Container data-testid={dataTestId}>{children}</Container>
);

const Container = styled.p`
  font-weight: 600;
  margin-bottom: ${programItemCardEndMargin};
`;
