import { ReactElement, ReactNode } from "react";
import styled from "styled-components";

interface Props {
  children?: ReactNode;
  className?: string;
}

export const ButtonGroup = ({ children, className }: Props): ReactElement => {
  return <Container className={className}>{children}</Container>;
};

const Container = styled.div`
  margin: 8px 0 8px 0;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;
