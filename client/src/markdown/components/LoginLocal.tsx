import { ReactElement, ReactNode } from "react";
import { LoginProvider } from "shared/config/sharedConfigTypes";
import { useAppSelector } from "client/utils/hooks";

interface Props {
  children: ReactNode;
}

// eslint-disable-next-line import/no-unused-modules
export const LoginLocal = ({ children }: Props): ReactElement => {
  const loginProvider = useAppSelector((state) => state.admin.loginProvider);

  return <span>{loginProvider === LoginProvider.LOCAL ? children : null}</span>;
};
