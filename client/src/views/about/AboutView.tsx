import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import AboutKonstiFi from "client/markdown/AboutKonstiFi.mdx";
import AboutKonstiEn from "client/markdown/AboutKonstiEn.mdx";

export const AboutView = (): ReactElement => {
  const { i18n } = useTranslation();

  return (
    <div>{i18n.language === "fi" ? <AboutKonstiFi /> : <AboutKonstiEn />}</div>
  );
};
