import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  children: ReactNode;
}

export const Fi = ({ children }: Props): ReactNode => {
  const { i18n } = useTranslation();

  return i18n.language === "fi" ? children : null;
};
