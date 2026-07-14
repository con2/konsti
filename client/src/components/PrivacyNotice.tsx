import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Accordion } from "client/components/Accordion";
import PrivacyNoticeText from "client/markdown/PrivacyNotice.mdx";

export const PrivacyNotice = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <Accordion
      closeAccordionText={t("hidePrivacyNotice")}
      openAccordionText={t("showPrivacyNotice")}
    >
      <PrivacyNoticeContent>
        <PrivacyNoticeText />
      </PrivacyNoticeContent>
    </Accordion>
  );
};

const PrivacyNoticeContent = styled.div`
  padding: 0 10px;
`;
