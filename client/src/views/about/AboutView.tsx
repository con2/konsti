import React, { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import aboutKonstiFi from "client/markdown/AboutKonstiFi.md";
import aboutKonstiEn from "client/markdown/AboutKonstiEn.md";

export const AboutView = (): ReactElement => {
  const { i18n } = useTranslation();

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {i18n.language === "fi" ? aboutKonstiFi : aboutKonstiEn}
    </ReactMarkdown>
  );
};
