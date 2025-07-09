import { ReactNode } from "react";
import Linkify from "linkify-react";

interface Props {
  children: ReactNode;
}

const linkifyOptions = {
  target: "_blank",
  rel: "noopener noreferrer",
};

export const TextWithLinks = ({ children }: Props): ReactNode => {
  return <Linkify options={linkifyOptions}>{children}</Linkify>;
};
