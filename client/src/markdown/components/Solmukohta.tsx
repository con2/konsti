import { ReactElement, ReactNode } from "react";
import { config } from "shared/config";
import { ConventionName } from "shared/config/sharedConfigTypes";

interface Props {
  children: ReactNode;
  not: boolean;
}

// eslint-disable-next-line import/no-unused-modules
export const Solmukohta = ({ children, not }: Props): ReactElement => {
  const visibleContent = not
    ? config.shared().conventionName !== ConventionName.SOLMUKOHTA
    : config.shared().conventionName === ConventionName.SOLMUKOHTA;

  return <span>{visibleContent ? children : null}</span>;
};
