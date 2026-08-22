import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { getHelpDesks } from "./helpDeskList";

export const HelpDesks = (): ReactNode => {
  const { i18n } = useTranslation();
  const helpDesks = getHelpDesks();
  const isFinnish = i18n.language === "fi";

  return (
    <ul>
      {helpDesks.map((desk) => {
        const name = isFinnish ? desk.nameFi : desk.nameEn;
        return <li key={name}>{name}</li>;
      })}
    </ul>
  );
};
