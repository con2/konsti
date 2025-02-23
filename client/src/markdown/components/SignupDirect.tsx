import { ReactNode } from "react";
import { EventSignupStrategy } from "shared/config/eventConfigTypes";
import { useAppSelector } from "client/utils/hooks";

interface Props {
  children: ReactNode;
}

// eslint-disable-next-line import/no-unused-modules
export const SignupDirect = ({ children }: Props): ReactNode => {
  const signupStrategy = useAppSelector((state) => state.admin.signupStrategy);

  return signupStrategy === EventSignupStrategy.DIRECT ? children : null;
};
