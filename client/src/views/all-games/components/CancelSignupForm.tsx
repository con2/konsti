import React, { ReactElement } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
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
      <Button onClick={onConfirmForm} buttonStyle={ButtonStyle.PRIMARY}>
        {t("signup.confirmCancelSignup")}
      </Button>

      <Button
        onClick={() => onCancelForm()}
        buttonStyle={ButtonStyle.SECONDARY}
      >
        {t("signup.cancel")}
      </Button>
    </ButtonGroup>
  );
};
