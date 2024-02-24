import { ReactElement, ReactNode } from "react";
import { config } from "shared/config";
import { SignupStrategy } from "shared/config/sharedConfigTypes";

interface Props {
  children: ReactNode;
}

// eslint-disable-next-line import/no-unused-modules
export const SignupLottery = ({ children }: Props): ReactElement => {
  return (
    <span>
      {config.shared().defaultSignupStrategy !== SignupStrategy.DIRECT
        ? children
        : null}
    </span>
  );
};
