import React, { ReactElement, useState } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button, ButtonStyle } from "client/components/Button";
import aboutKonstiFi from "client/markdown/AboutKonstiFi.md";
import aboutKonstiEn from "client/markdown/AboutKonstiEn.md";
import konstiFaqFi from "client/markdown/KonstiFaqFi.md";
import konstiFaqEn from "client/markdown/KonstiFaqEn.md";

enum AboutSection {
  FAQ = "faq",
  GENERAL = "general",
}

export const AboutView = (): ReactElement => {
  const { t, i18n } = useTranslation();

  const [selectedSection, setSelectedSection] = useState<AboutSection>(
    AboutSection.GENERAL
  );

  return (
    <div>
      <Button
        disabled={selectedSection === AboutSection.GENERAL}
        buttonStyle={ButtonStyle.SECONDARY}
        onClick={() => setSelectedSection(AboutSection.GENERAL)}
      >
        {t("aboutView.general")}
      </Button>
      <Button
        disabled={selectedSection === AboutSection.FAQ}
        buttonStyle={ButtonStyle.SECONDARY}
        onClick={() => setSelectedSection(AboutSection.FAQ)}
      >
        {t("aboutView.faq")}
      </Button>

      {selectedSection === AboutSection.GENERAL && (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {i18n.language === "fi" ? aboutKonstiFi : aboutKonstiEn}
        </ReactMarkdown>
      )}

      {selectedSection === AboutSection.FAQ && (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {i18n.language === "fi" ? konstiFaqFi : konstiFaqEn}
        </ReactMarkdown>
      )}
    </div>
  );
};
