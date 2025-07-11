import { ReactNode } from "react";
import { LoginProvider } from "shared/config/eventConfigTypes";
import { useAppSelector } from "client/utils/hooks";

interface Props {
  children: ReactNode;
}

export const LoginLocalKompassi = ({ children }: Props): ReactNode => {
  const loginProvider = useAppSelector((state) => state.admin.loginProvider);

  return loginProvider === LoginProvider.LOCAL_KOMPASSI ? children : null;
};
