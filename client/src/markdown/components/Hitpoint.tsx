import { ReactNode } from "react";
import { config } from "shared/config";
import { ConventionName } from "shared/config/eventConfigTypes";

interface Props {
  children: ReactNode;
}

export const Hitpoint = ({ children }: Props): ReactNode => {
  return config.event().conventionName === ConventionName.HITPOINT
    ? children
    : null;
};
