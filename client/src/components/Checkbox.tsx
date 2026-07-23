import { ReactElement, InputHTMLAttributes } from "react";
import styled from "styled-components";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  id: string;
};

export const Checkbox = (props: Props): ReactElement => {
  return (
    <Container>
      <StyledCheckbox {...props} type={"checkbox"} />
      <label htmlFor={props.id}>{props.label}</label>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  align-items: flex-start;
`;

const StyledCheckbox = styled.input`
  flex-shrink: 0;
  margin-top: 2px;
  margin-left: 4px;
  margin-right: 8px;
  accent-color: ${(props) => props.theme.formAccent};
  transform: scale(1.4);
`;
