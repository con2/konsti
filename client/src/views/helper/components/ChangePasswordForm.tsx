import React, { ChangeEvent, ReactElement, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styled, { css } from "styled-components";
import { useTranslation } from "react-i18next";
import { Button, ButtonStyle } from "client/components/Button";
import { updateUserPassword } from "client/services/userServices";
import { passwordLength } from "client/utils/validate";
import { useAppSelector } from "client/utils/hooks";

interface Props {
  username: string;
}

export const ChangePasswordForm = ({ username }: Props): ReactElement => {
  const { t } = useTranslation();

  const requester = useAppSelector((state) => state.login.username);

  const [changePasswordInput, setChangePasswordInput] = useState<string>("");
  const [passwordChangeMessage, setPasswordChangeMessage] =
    useState<ReactElement>(<Message />);
  const [passwordFieldType, setPasswordFieldType] =
    useState<string>("password");

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setChangePasswordInput(event.target.value);
  };

  const submitUpdatePassword = async (): Promise<void> => {
    const validationError = passwordLength(changePasswordInput);

    if (validationError) {
      setPasswordChangeMessage(
        <Message error={true}>{validationError}</Message>
      );
      return;
    }

    const response = await updateUserPassword(
      username,
      changePasswordInput,
      requester
    );

    if (!response || response.status === "error") {
      setPasswordChangeMessage(
        <Message error={true}>
          {t("passwordManagement.changingPasswordError")}
        </Message>
      );
    } else if (response.status === "success") {
      setPasswordChangeMessage(
        <Message>{t("passwordManagement.changingPasswordSuccess")}</Message>
      );
    }
  };

  const togglePasswordVisibility = (): void => {
    if (passwordFieldType === "password") setPasswordFieldType("text");
    else if (passwordFieldType === "text") setPasswordFieldType("password");
  };

  return (
    <>
      <p>{t("passwordManagement.newPassword")}</p>
      <FormInput
        type={passwordFieldType}
        key="new-password"
        placeholder={t("passwordManagement.newPassword")}
        value={changePasswordInput}
        onChange={handlePasswordChange}
      />
      <Button onClick={submitUpdatePassword} buttonStyle={ButtonStyle.NORMAL}>
        {t("button.save")}
      </Button>

      <FormFieldIcon>
        <FontAwesomeIcon
          icon={passwordFieldType === "password" ? "eye" : "eye-slash"}
          onClick={togglePasswordVisibility}
          aria-label={
            passwordFieldType === "password"
              ? t("iconAltText.showPassword")
              : t("iconAltText.hidePassword")
          }
        />
      </FormFieldIcon>

      {passwordChangeMessage}
    </>
  );
};

const FormFieldIcon = styled.span`
  padding: 0 0 0 8px;
  font-size: ${(props) => props.theme.fontSizeLarge};
`;

const FormInput = styled.input`
  border: 1px solid ${(props) => props.theme.borderInactive};
  color: ${(props) => props.theme.buttonText};
  height: 34px;
  padding: 0 0 0 10px;
  width: 100%;
`;

interface MessageProps {
  error?: boolean;
}

const Message = styled.p<MessageProps>`
  ${(messageProps) =>
    messageProps.error &&
    css`
      color: ${(props) => props.theme.textError};
    `};
`;
