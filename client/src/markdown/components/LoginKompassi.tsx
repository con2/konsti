import { ReactElement, ReactNode } from "react";
import { config } from "shared/config";
import { LoginProvider } from "shared/config/sharedConfigTypes";

interface Props {
  children: ReactNode;
}

// eslint-disable-next-line import/no-unused-modules
export const LoginKompassi = ({ children }: Props): ReactElement => {
  return (
    <span>
      {config.shared().defaultLoginProvider === LoginProvider.KOMPASSI
        ? children
        : null}
    </span>
  );
};
