import { ChangeEvent, ReactElement } from "react";
import { UseFormRegister } from "react-hook-form";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { RadioButtonGroup } from "client/components/RadioButtonGroup";
import { RadioButton } from "client/components/RadioButton";
import { UncontrolledInput } from "client/components/UncontrolledInput";

interface EmailSubscriptionFormProps {
  emailValue: string;
  emailNotificationsEnabled: boolean;
  onEmailChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onNotificationChange: (enabled: boolean) => void;
  register?: UseFormRegister<any>;
  disabled?: boolean;
}

export const EmailSubscriptionForm = ({
  emailValue,
  emailNotificationsEnabled,
  onEmailChange,
  onNotificationChange,
  register,
  disabled = false,
}: EmailSubscriptionFormProps): ReactElement => {
  const { t } = useTranslation();

  return (
    <RadioButtonGroup>
      <RadioButton
        checked={emailNotificationsEnabled}
        id={"email-notifications-enabled"}
        label={t("email.notifications.accepted")}
        name={"emailNotifications"}
        onChange={() => onNotificationChange(true)}
      />
      <InputContainer>
        <StyledEmailInput
          id="email"
          {...(register && register("email"))}
          defaultValue={emailValue}
          type={"email"}
          disabled={disabled || !emailNotificationsEnabled}
          onChange={onEmailChange}
        />
      </InputContainer>
      <RadioButton
        checked={!emailNotificationsEnabled}
        id={"email-notifications-disabled"}
        label={t("email.notifications.rejected")}
        name={"emailNotifications"}
        onChange={() => onNotificationChange(false)}
      />
    </RadioButtonGroup>
  );
};

const InputContainer = styled.div`
  display: flex;
  align-items: center;
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