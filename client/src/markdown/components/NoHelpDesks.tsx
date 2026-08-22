import { ReactNode } from "react";
import { getHelpDesks } from "./helpDeskList";

interface Props {
  children: ReactNode;
}

export const NoHelpDesks = ({ children }: Props): ReactNode => {
  return getHelpDesks().length === 0 ? children : null;
};
