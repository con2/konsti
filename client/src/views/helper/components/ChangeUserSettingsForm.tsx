import { ChangeEvent, ReactElement, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styled, { css } from "styled-components";
import { useTranslation } from "react-i18next";
import { Button, ButtonStyle } from "client/components/Button";
import { updateUserPassword } from "client/services/userServices";
import { RadioButtonGroup } from "client/components/RadioButtonGroup";
import { RadioButton } from "client/components/RadioButton";
import { UncontrolledInput } from "client/components/UncontrolledInput";
import { useAppDispatch } from "client/utils/hooks";
import { submitUpdateUserEmailAddress } from "client/views/login/loginThunks";
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

export const ChangeUserSettingsForm = ({
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
  const [emailValidationError, setEmailValidationError] = useState<string>("");

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

    const emailToSend = emailNotificationsEnabled
      ? changeEmailInput.trim()
      : "";
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (emailNotificationsEnabled && !emailRegex.test(emailToSend)) {
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

  const togglePasswordVisibility = (): void => {
    if (passwordFieldType === "password") {
      setPasswordFieldType("text");
    } else if (passwordFieldType === "text") {
      setPasswordFieldType("password");
    }
  };

  const handleEmailNotificationChange = (enabled: boolean): void => {
    setEmailNotificationsEnabled(enabled);
    if (!enabled) {
      setEmailValidationError("");
    }
  };

  return (
    <>
      <>
        <RadioButtonGroup>
          <RadioButton
            checked={emailNotificationsEnabled}
            id={"email-notifications-enabled"}
            label={t("email.notifications.accepted")}
            name={"emailNotifications"}
            onChange={() => handleEmailNotificationChange(true)}
          />
          <InputContainer>
            <StyledEmailInput
              id="email"
              value={changeEmailInput}
              type={"email"}
              disabled={!emailNotificationsEnabled}
              onChange={handleEmailChange}
            />
          </InputContainer>
          {emailValidationError && (
            <ErrorMessage>{emailValidationError}</ErrorMessage>
          )}
          <RadioButton
            checked={!emailNotificationsEnabled}
            id={"email-notifications-disabled"}
            label={t("email.notifications.rejected")}
            name={"emailNotifications"}
            onChange={() => handleEmailNotificationChange(false)}
          />
        </RadioButtonGroup>
        <ButtonWithMargin
          onClick={submitUpdateEmail}
          buttonStyle={ButtonStyle.PRIMARY}
        >
          {t("button.save")}
        </ButtonWithMargin>
        {emailChangeMessage}
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

const StyledEmailInput = styled(UncontrolledInput)`
  width: min(250px, 100%);
  ${(props) =>
    props.disabled &&
    `
      background-color: ${props.theme.backgroundDisabled || "#f5f5f5"};
      cursor: not-allowed;
      opacity: 0.6;
    `};
`;

const ErrorMessage = styled.div`
  display: flex;
  background: ${(props) => props.theme.backgroundHighlight};
  color: ${(props) => props.theme.textError};
  width: 50%;
  padding: 0 10px;
  margin-top: -8px;
  font-size: ${(props) => props.theme.fontSizeSmall};

  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
    width: 100%;
  }
`;
