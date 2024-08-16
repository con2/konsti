import { ReactNode } from "react";
import { config } from "shared/config";
import { ConventionName } from "shared/config/eventConfigTypes";

interface Props {
  children: ReactNode;
  not: boolean;
}

export const Solmukohta = ({ children, not }: Props): ReactNode => {
  const visibleContent = not
    ? config.event().conventionName !== ConventionName.SOLMUKOHTA
    : config.event().conventionName === ConventionName.SOLMUKOHTA;

  return visibleContent ? children : null;
};
