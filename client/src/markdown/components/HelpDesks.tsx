import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { config } from "shared/config";
import { EventName } from "shared/config/eventConfigTypes";

interface HelpDesk {
  nameFi: string;
  nameEn: string;
}

const helpDesksByEvent: Record<EventName, HelpDesk[]> = {
  [EventName.ROPECON]: [
    { nameFi: "Larp- ja Roolipelitiski", nameEn: "Larp & RPG Desk" },
    { nameFi: "Pelitiski", nameEn: "Gaming Desk" },
    { nameFi: "Info", nameEn: "Info Desk" },
  ],
  [EventName.HITPOINT]: [{ nameFi: "Roolipelitiski", nameEn: "RPG Desk" }],
  [EventName.TRACON]: [{ nameFi: "Roolipelitiski", nameEn: "RPG Desk" }],
  [EventName.SOLMUKOHTA]: [
    { nameFi: "Ohjelmatiski", nameEn: "Programme Desk" },
  ],
};

export const HelpDesks = (): ReactNode => {
  const { i18n } = useTranslation();
  const helpDesks = helpDesksByEvent[config.event().eventName];
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
