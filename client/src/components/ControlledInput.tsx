import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ChangeEvent, ReactElement } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { UncontrolledInput } from "client/components/UncontrolledInput";

interface Props {
  type?: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  resetValue?: () => void;
  id?: string;
  className?: string;
}

export const ControlledInput = ({
  type = "text",
  value,
  onChange,
  placeholder,
  resetValue,
  id,
  className,
}: Props): ReactElement => {
  const { t } = useTranslation();

  return (
    <InputContainer>
      <UncontrolledInput
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        id={id}
        className={className}
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
