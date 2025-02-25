import { ReactNode } from "react";
import { config } from "shared/config";
import { EventName } from "shared/config/eventConfigTypes";

interface Props {
  children: ReactNode;
}

export const Tracon = ({ children }: Props): ReactNode => {
  return config.event().eventName === EventName.TRACON ? children : null;
};
