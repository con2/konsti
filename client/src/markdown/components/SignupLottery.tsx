import { ReactNode } from "react";
import { SignupStrategy } from "shared/config/sharedConfigTypes";
import { useAppSelector } from "client/utils/hooks";

interface Props {
  children: ReactNode;
}

export const SignupLottery = ({ children }: Props): ReactNode => {
  const signupStrategy = useAppSelector((state) => state.admin.signupStrategy);

  return signupStrategy !== SignupStrategy.DIRECT ? children : null;
};
