import { ChangeEvent, ReactElement, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styled, { css } from "styled-components";
import { useTranslation } from "react-i18next";
import { Button, ButtonStyle } from "client/components/Button";
import { updateUserPassword } from "client/services/userServices";
import { ControlledInput } from "client/components/ControlledInput";
import {
  PASSWORD_LENGTH_MAX,
  PASSWORD_LENGTH_MIN,
} from "shared/constants/validation";

interface Props {
  usernameToUpdate: string;
}

export const ChangePasswordForm = ({
  usernameToUpdate,
}: Props): ReactElement => {
  const { t } = useTranslation();

  const [changePasswordInput, setChangePasswordInput] = useState<string>("");
  const [passwordChangeMessage, setPasswordChangeMessage] =
    useState<ReactElement>(<Message />);
  const [passwordFieldType, setPasswordFieldType] =
    useState<string>("password");

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setChangePasswordInput(event.target.value);
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

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!response || response.status === "error") {
      setPasswordChangeMessage(
        <Message error={true}>
          {t("passwordManagement.changingPasswordError")}
        </Message>,
      );
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    } else if (response.status === "success") {
      setPasswordChangeMessage(
        <Message>{t("passwordManagement.changingPasswordSuccess")}</Message>,
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

  return (
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
