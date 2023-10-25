import { ReactElement, ReactNode } from "react";
import { getSharedConfig } from "shared/config/sharedConfig";
import { ConventionName } from "shared/config/sharedConfigTypes";

interface Props {
  children: ReactNode;
}

// eslint-disable-next-line import/no-unused-modules
export const Ropecon = ({ children }: Props): ReactElement => {
  return (
    <span>
      {getSharedConfig().CONVENTION_NAME === ConventionName.ROPECON
        ? children
        : null}
    </span>
  );
};
