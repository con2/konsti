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
  [EventName.TRACON]: [],
  [EventName.SOLMUKOHTA]: [
    { nameFi: "Ohjelmatiski", nameEn: "Programme Desk" },
  ],
};

export const getHelpDesks = (): HelpDesk[] =>
  helpDesksByEvent[config.event().eventName];
