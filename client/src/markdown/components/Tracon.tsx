import { ReactNode } from "react";
import { config } from "shared/config";
import { ConventionName } from "shared/config/eventConfigTypes";

interface Props {
  children: ReactNode;
}

export const Tracon = ({ children }: Props): ReactNode => {
  return config.event().conventionName === ConventionName.TRACON
    ? children
    : null;
};
