import React, { ReactElement, ReactNode } from "react";
import styled from "styled-components";

interface Props {
  children?: ReactNode;
}

export const ButtonGroup = ({ children }: Props): ReactElement => {
  return <Container>{children}</Container>;
};

const Container = styled.div`
  margin: 8px 0 8px 0;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;
