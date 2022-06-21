import React, { ReactElement } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Button, ButtonStyle } from "client/components/Button";

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
    <ButtonContainer>
      <CancelSignupButton
        onClick={onConfirmForm}
        buttonStyle={ButtonStyle.WARNING}
      >
        {t("signup.confirmCancelSignup")}
      </CancelSignupButton>

      <CancelFormButton
        onClick={() => onCancelForm()}
        buttonStyle={ButtonStyle.NORMAL}
      >
        {t("signup.cancel")}
      </CancelFormButton>
    </ButtonContainer>
  );
};

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: row;
`;

const CancelSignupButton = styled(Button)`
  width: 50%;
`;

const CancelFormButton = styled(Button)`
  border: 1px solid ${(props) => props.theme.borderInformative};
  width: 50%;
`;
