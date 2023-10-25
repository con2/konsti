import { ReactElement, ReactNode } from "react";
import { CONVENTION_NAME, getSharedConfig } from "shared/config/sharedConfig";

interface Props {
  children: ReactNode;
}

// eslint-disable-next-line import/no-unused-modules
export const Ropecon = ({ children }: Props): ReactElement => {
  return (
    <span>
      {getSharedConfig().CONVENTION_NAME === CONVENTION_NAME.ROPECON
        ? children
        : null}
    </span>
  );
};
