import { ReactNode } from "react";
import { config } from "shared/config";
import { ConventionName } from "shared/config/sharedConfigTypes";

interface Props {
  children: ReactNode;
}

// eslint-disable-next-line import/no-unused-modules
export const Hitpoint = ({ children }: Props): ReactNode => {
  return config.shared().conventionName === ConventionName.HITPOINT
    ? children
    : null;
};
