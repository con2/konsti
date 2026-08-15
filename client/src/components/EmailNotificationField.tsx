import { ReactElement, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { RadioButton } from "client/components/RadioButton";
import { RadioButtonGroup } from "client/components/RadioButtonGroup";
import { UncontrolledInput } from "client/components/UncontrolledInput";

interface Props {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  children: ReactNode;
}

export const EmailNotificationField = ({
  enabled,
  onEnabledChange,
  children,
}: Props): ReactElement => {
  const { t } = useTranslation();

  return (
    <RadioButtonGroup>
      <RadioButton
        checked={enabled}
        id={"email-notifications-enabled"}
        label={t("email.notifications.accepted")}
        name={"emailNotifications"}
        onChange={() => onEnabledChange(true)}
      />
      <InputContainer>{children}</InputContainer>
      <RadioButton
        checked={!enabled}
        id={"email-notifications-disabled"}
        label={t("email.notifications.rejected")}
        name={"emailNotifications"}
        onChange={() => onEnabledChange(false)}
      />
    </RadioButtonGroup>
  );
};

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

export const StyledEmailInput = styled(UncontrolledInput)`
  width: min(250px, 100%);
  ${(props) =>
    props.disabled &&
    `
      background-color: ${props.theme.backgroundDisabled};
      cursor: not-allowed;
      opacity: 0.6;
    `};
`;
