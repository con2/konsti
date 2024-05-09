import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Button, ButtonStyle } from "client/components/Button";
import { ButtonGroup } from "client/components/ButtonGroup";

interface Props {
  onCancelForm: () => void;
  onConfirmForm: () => Promise<void>;
  loading: boolean;
}

export const CancelSignupForm = ({
  onCancelForm,
  onConfirmForm,
  loading,
}: Props): ReactElement => {
  const { t } = useTranslation();

  return (
    <StyledButtonGroup>
      <StyledButton
        onClick={onConfirmForm}
        buttonStyle={ButtonStyle.PRIMARY}
        disabled={loading}
      >
        {t("signup.confirmCancellation")}
      </StyledButton>

      <StyledButton
        onClick={() => onCancelForm()}
        buttonStyle={ButtonStyle.SECONDARY}
        disabled={loading}
      >
        {t("signup.staySignedUp")}
      </StyledButton>
    </StyledButtonGroup>
  );
};

const StyledButton = styled(Button)`
  min-width: 200px;
`;

const StyledButtonGroup = styled(ButtonGroup)`
  justify-content: center;
`;
