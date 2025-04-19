import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Accordion } from "client/components/Accordion";
import PrivacyPolicyText from "client/markdown/PrivacyPolicy.mdx";

export const PrivacyPolicy = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <Accordion
      closeAccordionText={t("hidePrivacyPolicy")}
      openAccordionText={t("showPrivacyPolicy")}
    >
      <PrivacyPolicyContent>
        <PrivacyPolicyText />
      </PrivacyPolicyContent>
    </Accordion>
  );
};

const PrivacyPolicyContent = styled.div`
  padding: 0 10px;
`;
