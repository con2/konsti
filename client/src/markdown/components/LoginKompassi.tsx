import { ReactNode } from "react";
import { LoginProvider } from "shared/config/sharedConfigTypes";
import { useAppSelector } from "client/utils/hooks";

interface Props {
  children: ReactNode;
}

export const LoginKompassi = ({ children }: Props): ReactNode => {
  const loginProvider = useAppSelector((state) => state.admin.loginProvider);

  return loginProvider === LoginProvider.KOMPASSI ? children : null;
};
