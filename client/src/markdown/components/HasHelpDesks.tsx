import { ReactNode } from "react";
import { getHelpDesks } from "./helpDeskList";

interface Props {
  children: ReactNode;
}

export const HasHelpDesks = ({ children }: Props): ReactNode => {
  return getHelpDesks().length > 0 ? children : null;
};
