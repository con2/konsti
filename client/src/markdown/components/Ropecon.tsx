import { ReactNode } from "react";
import { config } from "shared/config";
import { ConventionName } from "shared/config/eventConfigTypes";

interface Props {
  children: ReactNode;
}

export const Ropecon = ({ children }: Props): ReactNode => {
  return config.event().conventionName === ConventionName.ROPECON
    ? children
    : null;
};
