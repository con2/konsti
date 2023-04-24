import React, { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import konstiFaqFi from "client/markdown/KonstiFaqFi.md";
import konstiFaqEn from "client/markdown/KonstiFaqEn.md";

export const FaqView = (): ReactElement => {
  const { i18n } = useTranslation();

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {i18n.language === "fi" ? konstiFaqFi : konstiFaqEn}
    </ReactMarkdown>
  );
};
