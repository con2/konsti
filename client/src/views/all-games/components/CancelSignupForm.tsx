import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Button, ButtonStyle } from "client/components/Button";
import { ButtonGroup } from "client/components/ButtonGroup";

interface Props {
  onCancelForm: () => void;
  onConfirmForm: () => Promise<void>;
}

export const CancelSignupForm = ({
  onCancelForm,
  onConfirmForm,
}: Props): ReactElement => {
  const { t } = useTranslation();

  return (
    <ButtonGroup>
      <StyledButton onClick={onConfirmForm} buttonStyle={ButtonStyle.PRIMARY}>
        {t("signup.confirmCancellation")}
      </StyledButton>

      <StyledButton
        onClick={() => onCancelForm()}
        buttonStyle={ButtonStyle.SECONDARY}
      >
        {t("signup.staySignedUp")}
      </StyledButton>
    </ButtonGroup>
  );
};

const StyledButton = styled(Button)`
  min-width: 200px;
`;
