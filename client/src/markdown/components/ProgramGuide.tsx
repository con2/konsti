import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { config } from "shared/config";
import { EventName } from "shared/config/eventConfigTypes";

interface Props {
  children: ReactNode;
}

export const ProgramGuide = ({ children }: Props): ReactNode => {
  const { i18n } = useTranslation();
  const { programGuideUrl } = config.event();

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
