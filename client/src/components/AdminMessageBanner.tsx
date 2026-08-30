import { ReactElement, useState } from "react";
import { useTranslation } from "react-i18next";
import { DismissibleBanner } from "client/components/DismissibleBanner";
import { HighlightStyle } from "client/components/componentStyles";
import { useAppSelector } from "client/utils/hooks";
import {
  getDismissedAdminMessage,
  saveDismissedAdminMessage,
} from "client/utils/localStorage";

export const AdminMessageBanner = (): ReactElement | null => {
  const { t, i18n } = useTranslation();

  const adminMessageFi = useAppSelector((state) => state.admin.adminMessageFi);
  const adminMessageEn = useAppSelector((state) => state.admin.adminMessageEn);
  const [dismissedMessage, setDismissedMessage] = useState<string>(
    getDismissedAdminMessage(),
  );

  // Show the selected language, falling back to the other language so a message set in only
  // one language still reaches everyone. Trim so a whitespace-only field counts as empty.
  const primaryMessage =
    i18n.language === "fi" ? adminMessageFi : adminMessageEn;
  const fallbackMessage =
    i18n.language === "fi" ? adminMessageEn : adminMessageFi;
  const message = primaryMessage.trim() || fallbackMessage.trim();

  // The dismissal identity covers both languages, so dismissing hides the whole announcement
  // regardless of the active language and editing either language shows it again
  const identity = JSON.stringify([adminMessageFi, adminMessageEn]);

  // A dismissal only hides the exact message that was dismissed, so a new or edited admin
  // message (fetched on the next settings poll) shows again even after an earlier dismissal
  if (!message || identity === dismissedMessage) {
    return null;
  }

  const dismiss = (): void => {
    saveDismissedAdminMessage(identity);
    setDismissedMessage(identity);
  };

  return (
    <DismissibleBanner
      data-testid="admin-message-banner"
      icon="circle-exclamation"
      highlightStyle={HighlightStyle.WARN}
      onDismiss={dismiss}
      dismissAriaLabel={t("iconAltText.closeAdminMessage")}
    >
      <span>{message}</span>
    </DismissibleBanner>
  );
};
