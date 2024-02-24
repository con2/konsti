import { ReactElement, ReactNode } from "react";
import { LoginProvider } from "shared/config/sharedConfigTypes";
import { useAppSelector } from "client/utils/hooks";

interface Props {
  children: ReactNode;
}

// eslint-disable-next-line import/no-unused-modules
export const LoginKompassi = ({ children }: Props): ReactElement => {
  const loginProvider = useAppSelector((state) => state.admin.loginProvider);

  return (
    <span>{loginProvider === LoginProvider.KOMPASSI ? children : null}</span>
  );
};
