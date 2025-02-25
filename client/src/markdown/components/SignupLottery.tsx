import { ReactNode } from "react";
import { EventSignupStrategy } from "shared/config/eventConfigTypes";
import { useAppSelector } from "client/utils/hooks";

interface Props {
  children: ReactNode;
}

export const SignupLottery = ({ children }: Props): ReactNode => {
  const signupStrategy = useAppSelector((state) => state.admin.signupStrategy);

  return signupStrategy === EventSignupStrategy.DIRECT ? null : children;
};
