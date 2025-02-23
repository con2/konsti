import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  children: ReactNode;
}

// eslint-disable-next-line import/no-unused-modules
export const Fi = ({ children }: Props): ReactNode => {
  const { i18n } = useTranslation();

  return i18n.language === "fi" ? children : null;
};
