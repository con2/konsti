import { ReactElement, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAppSelector } from "client/utils/hooks";
import {
  getDismissedAdminMessage,
  saveDismissedAdminMessage,
} from "client/utils/localStorage";
import { HEADER_HEIGHT } from "client/components/Header";

export const AdminMessageBanner = (): ReactElement | null => {
  const { t, i18n } = useTranslation();

  const adminMessageFi = useAppSelector((state) => state.admin.adminMessageFi);
  const adminMessageEn = useAppSelector((state) => state.admin.adminMessageEn);
  const [dismissedMessage, setDismissedMessage] = useState<string>(
    getDismissedAdminMessage(),
  );

  // Show the selected language, falling back to the other language so a message set in only
  // one language still reaches everyone. Trim so a whitespace-only field counts as empty
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
    <BannerContainer data-testid="admin-message-banner">
      <Banner>
        <span>{message}</span>
        <CloseButton
          onClick={dismiss}
          aria-label={t("iconAltText.closeAdminMessage")}
        >
          <FontAwesomeIcon icon="xmark" />
        </CloseButton>
      </Banner>
    </BannerContainer>
  );
};

const BannerContainer = styled.div`
  position: sticky;
  top: ${HEADER_HEIGHT}px;
  z-index: 10;
`;

const Banner = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 10px;
  background-color: ${(props) => props.theme.backgroundHighlight};
  color: ${(props) => props.theme.textMain};
  border: 1px solid ${(props) => props.theme.borderWarning};
  border-radius: 4px;
  margin: 4px 2px;
`;

const CloseButton = styled.button`
  border: none;
  background: none;
  cursor: pointer;
  color: ${(props) => props.theme.textMain};
`;
