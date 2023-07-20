import { ReactElement } from "react";
import styled from "styled-components";

interface Props {
  checked: boolean;
  onChange: () => void;
  label: string;
  id: string;
}

export const Checkbox = ({
  checked,
  onChange,
  label,
  id,
}: Props): ReactElement => {
  return (
    <div>
      <StyledCheckbox
        type={"checkbox"}
        checked={checked}
        onChange={onChange}
        id={id}
      />
      <label htmlFor={id}>{label}</label>
    </div>
  );
};

const StyledCheckbox = styled.input`
  margin-right: 10px;
  width: 16px;
  accent-color: ${(props) => props.theme.formAccent};
`;
