import styled from "styled-components";
import { ReactElement, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export const InfoText = ({ children }: Props): ReactElement => (
  <Container>{children}</Container>
);

const Container = styled.p`
  border: 1px solid ${(props) => props.theme.infoBorder};
  padding: 8px 6px;
  border-radius: 5px;
  border-left: 5px solid ${(props) => props.theme.infoBorder};
  background-color: ${(props) => props.theme.infoBackground};
`;
