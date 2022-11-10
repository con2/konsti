import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { ChangeEvent, ReactElement } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

interface Props {
  type: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  resetValue?: () => void;
}

export const Input = ({
  type,
  value,
  onChange,
  placeholder,
  resetValue,
}: Props): ReactElement => {
  const { t } = useTranslation();

  return (
    <InputContainer>
      <StyledInput
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />

      {resetValue && (
        <StyledIcon
          onClick={resetValue}
          icon="xmark"
          aria-label={t("iconAltText.resetInput")}
        />
      )}
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
  box-sizing: border-box;
  border-radius: 6px;
  color: ${(props) => props.theme.textMain};
  height: 34px;
  padding: 0 0 0 10px;
  margin-right: 8px;
  width: 100%;

  &:focus {
    outline: 2px solid ${(props) => props.theme.inputBorderFocus};
    border: none;
  }

  &::placeholder {
    color: ${(props) => props.theme.inputTextPlaceholder};
  }
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
