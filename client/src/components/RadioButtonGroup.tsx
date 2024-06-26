import { ReactElement, ReactNode } from "react";
import styled from "styled-components";

interface Props {
  children?: ReactNode;
}
export const RadioButtonGroup = ({ children }: Props): ReactElement => (
  <StyledFieldSet>{children}</StyledFieldSet>
);

const StyledFieldSet = styled.fieldset`
  border: none;
  margin: -4px 0 -8px 0;
  padding-left: 0;
  display: flex;
  flex-direction: column;
  row-gap: 8px;
`;
