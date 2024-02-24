import { ReactElement, ReactNode } from "react";
import { SignupStrategy } from "shared/config/sharedConfigTypes";
import { useAppSelector } from "client/utils/hooks";

interface Props {
  children: ReactNode;
}

// eslint-disable-next-line import/no-unused-modules
export const SignupLottery = ({ children }: Props): ReactElement => {
  const signupStrategy = useAppSelector((state) => state.admin.signupStrategy);

  return (
    <span>{signupStrategy !== SignupStrategy.DIRECT ? children : null}</span>
  );
};
