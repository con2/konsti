import { ReactNode } from "react";
import { config } from "shared/config";
import { EventName } from "shared/config/eventConfigTypes";

interface Props {
  children: ReactNode;
}

// eslint-disable-next-line import/no-unused-modules
export const Ropecon = ({ children }: Props): ReactNode => {
  return config.event().eventName === EventName.ROPECON ? children : null;
};
