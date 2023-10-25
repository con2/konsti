import { ReactElement, ReactNode } from "react";
import { getSharedConfig } from "shared/config/sharedConfig";
import { ConventionName } from "shared/config/sharedConfigTypes";

interface Props {
  children: ReactNode;
}

// eslint-disable-next-line import/no-unused-modules
export const Hitpoint = ({ children }: Props): ReactElement => {
  return (
    <span>
      {getSharedConfig().CONVENTION_NAME === ConventionName.TRACON_HITPOINT
        ? children
        : null}
    </span>
  );
};
