import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  children: ReactNode;
}

export const En = ({ children }: Props): ReactNode => {
  const { i18n } = useTranslation();

  return i18n.language === "en" ? children : null;
};
