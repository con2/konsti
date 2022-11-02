import React, { ReactElement, ChangeEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import styled, { css } from "styled-components";
import { getUserBySerialOrUsername } from "client/services/userServices";
import { Button, ButtonStyle } from "client/components/Button";
import { ChangePasswordForm } from "client/views/helper/components/ChangePasswordForm";

export const PasswordManagement = (): ReactElement => {
  const { t } = useTranslation();

  const [username, setUsername] = useState<string>("");
  const [userSerialInput, setUserSerialInput] = useState<string>("");
  const [changePasswordInputVisible, setChangePasswordInputVisible] =
    useState<boolean>(false);
  const [userFoundMessage, setUserFoundMessage] = useState<ReactElement>(
    <Message />
  );

  const submitGetUser = async (): Promise<void> => {
    if (userSerialInput.length === 0) return;

    const response = await getUserBySerialOrUsername(userSerialInput);

    if (!response || response.status === "error") {
      setUserFoundMessage(
        <Message error={true}>{t("passwordManagement.userNotFound")}</Message>
      );
      setChangePasswordInputVisible(false);
    } else if (response.status === "success") {
      setUserFoundMessage(
        <Message>
          {t("passwordManagement.foundUser")}: {response.username} (
          {response.serial})
        </Message>
      );
      setUsername(response.username);
      setChangePasswordInputVisible(true);
    }
  };

  const handleSerialChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setUserSerialInput(event.target.value);
  };

  return (
    <div>
      <h3>{t("passwordManagement.helperPasswordManagement")}</h3>
      <p>{t("passwordManagement.userCodeOrUsername")}</p>

      <FormInput
        key="user-serial"
        placeholder={t("passwordManagement.userCodeOrUsername")}
        value={userSerialInput}
        onChange={handleSerialChange}
      />

      <Button onClick={submitGetUser} buttonStyle={ButtonStyle.PRIMARY}>
        {t("button.find")}
      </Button>

      {userFoundMessage}

      {changePasswordInputVisible && <ChangePasswordForm username={username} />}
    </div>
  );
};

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
