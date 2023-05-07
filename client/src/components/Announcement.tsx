import React, { ReactElement } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";

export const Announcement = (): ReactElement => {
  const { t } = useTranslation();

  return <AnnouncementMessage>{t("announcement")}</AnnouncementMessage>;
};

const AnnouncementMessage = styled.h3`
  text-align: center;
`;
