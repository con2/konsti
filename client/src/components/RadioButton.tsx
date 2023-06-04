import { ChangeEvent, ReactElement } from "react";
import styled from "styled-components";

interface Props {
  checked: boolean;
  id: string;
  name?: string;
  label: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export const RadioButton = ({
  checked,
  id,
  label,
  name,
  onChange,
}: Props): ReactElement => {
  return (
    <StyledLabel htmlFor={id}>
      <StyledRadioButton
        checked={checked}
        onChange={onChange}
        type="radio"
        id={id}
        name={name}
      />
      {label}
    </StyledLabel>
  );
};

const StyledLabel = styled.label`
  font-size: ${(props) => props.theme.fontSizeNormal};
`;

const StyledRadioButton = styled.input`
  accent-color: ${(props) => props.theme.formAccent};
`;
