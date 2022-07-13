import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { ChangeEvent, ReactElement } from "react";
import styled from "styled-components";

interface Props {
  type: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  resetValue: () => void;
}

export const Input = ({
  type,
  value,
  onChange,
  placeholder,
  resetValue,
}: Props): ReactElement => {
  return (
    <InputContainer>
      <StyledInput
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />

      <StyledIcon onClick={resetValue} icon="xmark" />
    </InputContainer>
  );
};

const InputContainer = styled.div`
  display: flex;
  margin: 20px 0 0 0;
  align-items: center;
`;

const StyledInput = styled.input`
  border: 1px solid ${(props) => props.theme.borderInactive};
  color: ${(props) => props.theme.buttonText};
  height: 34px;
  padding: 0 0 0 10px;
  margin-right: 8px;
  width: 100%;
`;

const StyledIcon = styled(FontAwesomeIcon)`
  border-radius: 12px;
  width: 18px;
  height: 32px;
  cursor: pointer;
  font-size: ${(props) => props.theme.fontSizeLarge};
  vertical-align: middle;
  margin-bottom: 2px;
`;
