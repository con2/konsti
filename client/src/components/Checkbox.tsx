import { ReactElement, InputHTMLAttributes } from "react";
import styled from "styled-components";

type Props = {
  label: string;
  id: string;
} & InputHTMLAttributes<HTMLInputElement>;

export const Checkbox = (props: Props): ReactElement => {
  return (
    <div>
      <StyledCheckbox {...props} type={"checkbox"} />
      <label htmlFor={props.id}>{props.label}</label>
    </div>
  );
};

const StyledCheckbox = styled.input`
  margin-right: 8px;
  width: 16px;
  accent-color: ${(props) => props.theme.formAccent};
  transform: scale(1.4);
`;
