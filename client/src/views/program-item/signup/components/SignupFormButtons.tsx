import { ReactElement, SyntheticEvent } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Button, ButtonStyle } from "client/components/Button";
import { ButtonGroup } from "client/components/ButtonGroup";
import { programItemCardEndMargin } from "client/views/my-program-items/components/shared";

interface Props {
  onConfirm: (event: SyntheticEvent) => Promise<void>;
  onCancel: () => void;
  confirmDisabled: boolean;
  loading: boolean;
}

// Both buttons are disabled while a signup request is in flight; confirm is
// additionally disabled by form validity
export const SignupFormButtons = ({
  onConfirm,
  onCancel,
  confirmDisabled,
  loading,
}: Props): ReactElement => {
  const { t } = useTranslation();

  return (
    <Container>
      <StyledButton
        onClick={onConfirm}
        buttonStyle={ButtonStyle.PRIMARY}
        disabled={confirmDisabled || loading}
      >
        {t("signup.confirm")}
      </StyledButton>
      <StyledButton
        onClick={onCancel}
        buttonStyle={ButtonStyle.SECONDARY}
        disabled={loading}
      >
        {t("signup.cancel")}
      </StyledButton>
    </Container>
  );
};

const Container = styled(ButtonGroup)`
  justify-content: center;
  margin-bottom: ${programItemCardEndMargin};
`;

const StyledButton = styled(Button)`
  min-width: 200px;

  /* Force confirm and cancel buttons to same row on mobile */
  @media (max-width: ${(props) => props.theme.breakpointDesktop}) {
    flex: 1;
    min-width: 0;
  }
`;
