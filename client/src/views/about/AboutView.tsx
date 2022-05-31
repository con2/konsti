import React, { ReactElement } from "react";
import { useTranslation } from "react-i18next";

export const AboutView = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <>
      <h2>{t("aboutView.title")}</h2>
      <div>{t("aboutView.description")}</div>
    </>
  );
};
