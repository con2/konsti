import { ChangeEvent, ReactElement, useState } from "react";
import styled, { css } from "styled-components";
import { useTranslation } from "react-i18next";
import { Button, ButtonStyle } from "client/components/Button";
import { useAppDispatch } from "client/utils/hooks";
import { submitUpdateUserEmailAddress } from "client/views/login/loginThunks";
import {
  EMAIL_REGEX,
  EmailNotificationField,
  StyledEmailInput,
} from "client/components/EmailNotificationField";

interface Props {
  email: string;
}

// The logged-in user's own email notification settings — shown only in Profile, never in the
// helper flow where another user is managed (there the email endpoint would target the helper)
export const EmailSettingsForm = ({ email }: Props): ReactElement => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const [changeEmailInput, setChangeEmailInput] = useState<string>(email);
  const [emailChangeMessage, setEmailChangeMessage] = useState<ReactElement>(
    <Message />,
  );
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] =
    useState<boolean>(email.length > 0);

  // Editing the form or starting a new save dismisses the previous save's
  // message, so the visible message always refers to the current form state
  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setChangeEmailInput(event.target.value);
    setEmailChangeMessage(<Message />);
  };

  const handleEmailNotificationChange = (enabled: boolean): void => {
    setEmailNotificationsEnabled(enabled);
    setEmailChangeMessage(<Message />);
  };

  const submitUpdateEmail = async (): Promise<void> => {
    setEmailChangeMessage(<Message />);

    if (emailNotificationsEnabled && !changeEmailInput.trim()) {
      setEmailChangeMessage(
        <Message error={true}>{t("validation.required")}</Message>,
      );
      return;
    }

    const emailToSend = emailNotificationsEnabled
      ? changeEmailInput.trim()
      : "";
    if (emailNotificationsEnabled && !EMAIL_REGEX.test(emailToSend)) {
      setEmailChangeMessage(
        <Message error={true}>{t("validation.invalidEmail")}</Message>,
      );
      return;
    }

    const emailErrorMessage = await dispatch(
      submitUpdateUserEmailAddress(emailToSend),
    );
    if (emailErrorMessage) {
      setEmailChangeMessage(
        <Message error={true}>
          {t("email.notifications.changingEmailError")}
        </Message>,
      );
    } else {
      setEmailChangeMessage(
        <Message>{t("email.notifications.changingEmailSuccess")}</Message>,
      );
    }
  };

  return (
    <>
      <EmailNotificationField
        enabled={emailNotificationsEnabled}
        onEnabledChange={handleEmailNotificationChange}
      >
        <StyledEmailInput
          id="email"
          value={changeEmailInput}
          type={"email"}
          disabled={!emailNotificationsEnabled}
          onChange={handleEmailChange}
        />
      </EmailNotificationField>
      <ButtonWithMargin
        onClick={submitUpdateEmail}
        buttonStyle={ButtonStyle.PRIMARY}
      >
        {t("button.save")}
      </ButtonWithMargin>
      {emailChangeMessage}
    </>
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
