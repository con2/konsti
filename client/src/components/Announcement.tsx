import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

export const Announcement = (): ReactElement => {
  const { t } = useTranslation();

  return <AnnouncementMessage>{t("announcement")}</AnnouncementMessage>;
};

const AnnouncementMessage = styled.h3`
  text-align: center;
`;
