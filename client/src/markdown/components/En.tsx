import { ReactElement, ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  children: ReactNode;
}

// eslint-disable-next-line import/no-unused-modules
export const En = ({ children }: Props): ReactElement => {
  const { i18n } = useTranslation();

  return <div>{i18n.language === "en" ? children : null}</div>;
};
