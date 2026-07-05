import { ReactElement, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Button, ButtonStyle } from "client/components/Button";
import { ButtonGroup } from "client/components/ButtonGroup";
import { TextArea } from "client/components/TextArea";
import { ADMIN_MESSAGE_LENGTH_MAX } from "shared/constants/validation";

interface Props {
  adminMessageFi: string;
  adminMessageEn: string;
  submitting: boolean;
  onSave: (adminMessageFi: string, adminMessageEn: string) => void;
}

// The inputs seed from the stored message; the parent keys this component on the stored value so
// it remounts (re-seeding) when the message changes, rather than syncing state in an effect
export const AdminMessageEditor = ({
  adminMessageFi,
  adminMessageEn,
  submitting,
  onSave,
}: Props): ReactElement => {
  const { t } = useTranslation();
  const [adminMessageFiInput, setAdminMessageFiInput] =
    useState<string>(adminMessageFi);
  const [adminMessageEnInput, setAdminMessageEnInput] =
    useState<string>(adminMessageEn);

  const unchanged =
    adminMessageFiInput === adminMessageFi &&
    adminMessageEnInput === adminMessageEn;
  // Save accepts a message only when both languages are filled, or both empty (which removes it) —
  // never a partial. Clear removes the message directly, whatever is currently typed
  const fiFilled = adminMessageFiInput.trim() !== "";
  const enFilled = adminMessageEnInput.trim() !== "";
  const partial = fiFilled !== enFilled;
  const nothingToClear =
    !adminMessageFi &&
    !adminMessageEn &&
    !adminMessageFiInput &&
    !adminMessageEnInput;

  return (
    <AdminMessageForm>
      <label>
        {t("signupQuestion.inFinnish")}
        <TextArea
          rows={3}
          maxLength={ADMIN_MESSAGE_LENGTH_MAX}
          placeholder={t("admin.adminMessagePlaceholder")}
          value={adminMessageFiInput}
          onChange={(event) => setAdminMessageFiInput(event.target.value)}
          disabled={submitting}
        />
      </label>
      <label>
        {t("signupQuestion.inEnglish")}
        <TextArea
          rows={3}
          maxLength={ADMIN_MESSAGE_LENGTH_MAX}
          placeholder={t("admin.adminMessagePlaceholder")}
          value={adminMessageEnInput}
          onChange={(event) => setAdminMessageEnInput(event.target.value)}
          disabled={submitting}
        />
      </label>
      <ButtonGroup>
        <Button
          disabled={submitting || unchanged || partial}
          buttonStyle={ButtonStyle.PRIMARY}
          onClick={() => onSave(adminMessageFiInput, adminMessageEnInput)}
        >
          {t("button.saveAdminMessage")}
        </Button>
        <Button
          disabled={submitting || nothingToClear}
          buttonStyle={ButtonStyle.SECONDARY}
          onClick={() => {
            setAdminMessageFiInput("");
            setAdminMessageEnInput("");
            onSave("", "");
          }}
        >
          {t("button.clearAdminMessage")}
        </Button>
      </ButtonGroup>
    </AdminMessageForm>
  );
};

const AdminMessageForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;

  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-width: 500px;
  }
`;
