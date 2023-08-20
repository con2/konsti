import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import KonstiFaqFi from "client/markdown/KonstiFaqFi.mdx";
import KonstiFaqEn from "client/markdown/KonstiFaqEn.mdx";

export const FaqView = (): ReactElement => {
  const { i18n } = useTranslation();

  return (
    <div>{i18n.language === "fi" ? <KonstiFaqFi /> : <KonstiFaqEn />}</div>
  );
};
