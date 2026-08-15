import { ReactElement, Suspense } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Accordion } from "client/components/Accordion";
import { Loading } from "client/components/Loading";
import { lazyWithRetry } from "client/utils/lazyWithRetry";

// The accordion only mounts its content once opened, so the notice text is
// fetched when a registering user asks to read it rather than on every load
const PrivacyNoticeText = lazyWithRetry(
  async () => await import("client/markdown/PrivacyNotice.mdx"),
);

export const PrivacyNotice = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <Accordion
      closeAccordionText={t("hidePrivacyNotice")}
      openAccordionText={t("showPrivacyNotice")}
    >
      <PrivacyNoticeContent>
        <Suspense fallback={<Loading />}>
          <PrivacyNoticeText />
        </Suspense>
      </PrivacyNoticeContent>
    </Accordion>
  );
};

const PrivacyNoticeContent = styled.div`
  padding: 0 10px;
`;
