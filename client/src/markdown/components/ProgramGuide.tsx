import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { config } from "shared/config";

export const ProgramGuide = (): ReactNode => {
  const { i18n } = useTranslation();
  const { programGuideUrlFi, programGuideUrlEn } = config.event();
  const programGuideUrl =
    i18n.language === "fi" ? programGuideUrlFi : programGuideUrlEn;

  if (programGuideUrl) {
    return (
      <Link to={programGuideUrl} target="_blank">
        {i18n.language === "fi" ? "ohjelmaoppaassa" : "program guide"}
      </Link>
    );
  }

  return (
    <span>{i18n.language === "fi" ? "ohjelmaoppaassa" : "program guide"}</span>
  );
};
