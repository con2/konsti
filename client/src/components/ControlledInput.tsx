import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { ChangeEvent, ReactElement } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Input } from "client/components/Input";

interface Props {
  type?: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  resetValue?: () => void;
}

export const ControlledInput = ({
  type = "text",
  value,
  onChange,
  placeholder,
  resetValue,
}: Props): ReactElement => {
  const { t } = useTranslation();

  return (
    <InputContainer>
      <Input
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
  align-items: center;
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
