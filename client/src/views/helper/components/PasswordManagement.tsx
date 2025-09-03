import { ReactElement, ChangeEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import styled, { css } from "styled-components";
import { Link } from "react-router";
import { getUserBySerialOrUsername } from "client/services/userServices";
import { Button, ButtonStyle } from "client/components/Button";
import { ChangeUserSettingsForm } from "client/views/helper/components/ChangeUserSettingsForm";
import { ControlledInput } from "client/components/ControlledInput";
import { getDateAndTime } from "shared/utils/timeFormatter";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";
import { useAppSelector } from "client/utils/hooks";

export const PasswordManagement = (): ReactElement => {
  const { t } = useTranslation();

  const [usernameToUpdate, setUsernameToUpdate] = useState<string>("");
  const [userSerialInput, setUserSerialInput] = useState<string>("");
  const email = useAppSelector((state) => state.login.email);
  const [changePasswordInputVisible, setChangePasswordInputVisible] =
    useState<boolean>(false);
  const [userFoundMessage, setUserFoundMessage] = useState<ReactElement>(
    <Message />,
  );

  const submitGetUser = async (): Promise<void> => {
    if (userSerialInput.length === 0) {
      return;
    }

    const response = await getUserBySerialOrUsername(userSerialInput);

    if (response.status === "error") {
      switch (response.errorId) {
        case "kompassiLogin":
          setUserFoundMessage(
            <Message error={true}>
              {t("passwordManagement.kompassiUserError")}
            </Message>,
          );
          setChangePasswordInputVisible(false);
          return;
        case "unknown":
          setUserFoundMessage(
            <Message error={true}>
              {t("passwordManagement.userNotFound")}
            </Message>,
          );
          setChangePasswordInputVisible(false);
          return;
        default:
          return exhaustiveSwitchGuard(response.errorId);
      }
    }

    setUserFoundMessage(
      <Message>
        {t("passwordManagement.foundUser")}: {response.username} (
        {response.serial}) - {t("passwordManagement.userCreatedAt")}{" "}
        {getDateAndTime(response.createdAt)}
      </Message>,
    );
    setUsernameToUpdate(response.username);
    setChangePasswordInputVisible(true);
  };

  const handleSerialChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setUserSerialInput(event.target.value);
  };

  return (
    <div>
      <h3>{t("passwordManagement.helperPasswordManagement")}</h3>
      <p>
        {t("passwordManagement.kompassiLocalInfo")}{" "}
        <Link to={"https://kompassi.eu/profile/password/reset"} target="_blank">
          {t("passwordManagement.kompassiPasswordReset")}
        </Link>
        .
      </p>
      <p>{t("passwordManagement.userCodeOrUsername")}</p>

      <ControlledInput
        key="user-serial"
        placeholder={t("passwordManagement.userCodeOrUsername")}
        value={userSerialInput}
        onChange={handleSerialChange}
      />

      <ButtonWithMargin
        onClick={submitGetUser}
        buttonStyle={ButtonStyle.PRIMARY}
      >
        {t("button.find")}
      </ButtonWithMargin>

      {userFoundMessage}

      {changePasswordInputVisible && (
        <ChangeUserSettingsForm
          usernameToUpdate={usernameToUpdate}
          isLocalLogin={true}
          email={email}
        />
      )}
    </div>
  );
};

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

const ButtonWithMargin = styled(Button)`
  margin-top: 8px;
`;
