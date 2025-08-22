import { ChangeEvent, ReactElement, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styled, { css } from "styled-components";
import { useTranslation } from "react-i18next";
import { Button, ButtonStyle } from "client/components/Button";
import { updateUserPassword } from "client/services/userServices";
import { EmailSubscriptionForm } from "client/components/EmailSubscriptionForm";
import { useAppDispatch } from "client/utils/hooks";
import {
  submitUpdateUserEmailAddress,
  UpdateUserEmailAddressErrorMessage,
} from "client/views/login/loginThunks";
import {
  PASSWORD_LENGTH_MAX,
  PASSWORD_LENGTH_MIN,
} from "shared/constants/validation";
import { ControlledInput } from "client/components/ControlledInput";

interface Props {
  usernameToUpdate: string;
  isLocalLogin: boolean;
  email: string;
}

export const ChangePasswordForm = ({
  usernameToUpdate,
  isLocalLogin,
  email,
}: Props): ReactElement => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const [changePasswordInput, setChangePasswordInput] = useState<string>("");
  const [passwordChangeMessage, setPasswordChangeMessage] =
    useState<ReactElement>(<Message />);
  const [passwordFieldType, setPasswordFieldType] =
    useState<string>("password");
  const [changeEmailInput, setChangeEmailInput] = useState<string>(email);
  const [emailChangeMessage, setEmailChangeMessage] = useState<ReactElement>(
    <Message />,
  );
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] =
    useState<boolean>(email.length > 0);
  const [serverError, setServerError] =
    useState<UpdateUserEmailAddressErrorMessage | null>(null);

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setChangePasswordInput(event.target.value);
  };

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setChangeEmailInput(event.target.value);
  };

  const passwordLength = (value: string): string | null => {
    if (value.length < PASSWORD_LENGTH_MIN) {
      return t("validation.tooShort", { length: PASSWORD_LENGTH_MIN });
    }
    if (value.length > PASSWORD_LENGTH_MAX) {
      return t("validation.tooLong", { length: PASSWORD_LENGTH_MAX });
    }
    return null;
  };

  const submitUpdatePassword = async (): Promise<void> => {
    const validationError = passwordLength(changePasswordInput);

    if (validationError) {
      setPasswordChangeMessage(
        <Message error={true}>{validationError}</Message>,
      );
      return;
    }

    const response = await updateUserPassword(
      usernameToUpdate,
      changePasswordInput,
    );

    if (response.status === "error") {
      setPasswordChangeMessage(
        <Message error={true}>
          {t("passwordManagement.changingPasswordError")}
        </Message>,
      );
    } else {
      setPasswordChangeMessage(
        <Message>{t("passwordManagement.changingPasswordSuccess")}</Message>,
      );
    }
  };

  const submitUpdateEmail = async (): Promise<void> => {
    if (emailNotificationsEnabled && !changeEmailInput.trim()) {
      setEmailChangeMessage(
        <Message error={true}>{t("validation.required")}</Message>,
      );
      return;
    }

    const emailToSend = emailNotificationsEnabled ? changeEmailInput : "";
    const emailErrorMessage = await dispatch(
      submitUpdateUserEmailAddress(emailToSend),
    );
    if (emailErrorMessage) {
      setServerError(emailErrorMessage);
      setEmailChangeMessage(
        <Message error={true}>
          {t("email.notifications.changingEmailError")}
        </Message>,
      );
    } else {
      setServerError(null);
      setEmailChangeMessage(
        <Message>{t("email.notifications.changingEmailSuccess")}</Message>,
      );
    }
  };

  const togglePasswordVisibility = (): void => {
    if (passwordFieldType === "password") {
      setPasswordFieldType("text");
    } else if (passwordFieldType === "text") {
      setPasswordFieldType("password");
    }
  };

  const handleEmailNotificationChange = (enabled: boolean): void => {
    setEmailNotificationsEnabled(enabled);
  };

  return (
    <>
      <>
        <StyledLabel>{t("email.notifications.changeEmail")}</StyledLabel>
        <EmailSubscriptionForm
          emailValue={changeEmailInput}
          emailNotificationsEnabled={emailNotificationsEnabled}
          onEmailChange={handleEmailChange}
          onNotificationChange={handleEmailNotificationChange}
        />
        <ButtonWithMargin
          onClick={submitUpdateEmail}
          buttonStyle={ButtonStyle.PRIMARY}
        >
          {t("button.save")}
        </ButtonWithMargin>
        {emailChangeMessage}
        <p>{t("email.notifications.description")}</p>
      </>
      {isLocalLogin ? (
        <>
          <StyledLabel>{t("passwordManagement.changePassword")}</StyledLabel>
          <InputContainer>
            <ControlledInput
              type={passwordFieldType}
              key="new-password"
              placeholder={t("passwordManagement.newPassword")}
              value={changePasswordInput}
              onChange={handlePasswordChange}
            />

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
          </InputContainer>
          <ButtonWithMargin
            onClick={submitUpdatePassword}
            buttonStyle={ButtonStyle.PRIMARY}
          >
            {t("button.save")}
          </ButtonWithMargin>
          {passwordChangeMessage}
        </>
      ) : null}
    </>
  );
};

const InputContainer = styled.div`
  display: flex;
  align-items: center;
`;

const FormFieldIcon = styled.span`
  font-size: ${(props) => props.theme.fontSizeLarge};
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

const ButtonWithMargin = styled(Button)`
  margin-top: 8px;
`;

const StyledLabel = styled.label`
  padding: 0 0 2px 4px;
  font-size: ${(props) => props.theme.fontSizeSmall};
`;
