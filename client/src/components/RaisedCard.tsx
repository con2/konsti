import { ReactElement, ReactNode } from "react";
import styled from "styled-components";

interface Props {
  children: ReactNode;
  className?: string;
}

export const RaisedCard = ({ children, className }: Props): ReactElement => (
  <Card className={className}>{children}</Card>
);

const Card = styled.div`
  margin: 20px 0 20px 0;
  padding: 16px 8px 16px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fafafa;
  box-shadow: ${(props) => props.theme.shadowLower};
`;
