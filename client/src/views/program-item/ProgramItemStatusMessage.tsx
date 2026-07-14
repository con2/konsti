import { ReactElement, ReactNode } from "react";
import styled from "styled-components";

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

const Container = styled.div`
  margin: 0 0 8px 0;
  font-weight: 600;
`;
