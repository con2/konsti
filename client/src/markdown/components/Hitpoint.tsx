import { ReactElement, ReactNode } from "react";
import { CONVENTION_NAME, sharedConfig } from "shared/config/sharedConfig";

interface Props {
  children: ReactNode;
}

// eslint-disable-next-line import/no-unused-modules
export const Hitpoint = ({ children }: Props): ReactElement => {
  return (
    <span>
      {sharedConfig.CONVENTION_NAME === CONVENTION_NAME.TRACON_HITPOINT
        ? children
        : null}
    </span>
  );
};
