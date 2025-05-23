import { ReactElement } from "react";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslation } from "react-i18next";

export const ScrollToTopButton = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <FloatingButton
      aria-label={t("button.scrollToTop")}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <Icon aria-hidden="true" icon="chevron-up" />
    </FloatingButton>
  );
};

const FloatingButton = styled.button`
  position: fixed;
  bottom: 20px;
  right: 20px;
  border-radius: 100px;
  border: none;
  cursor: pointer;
  width: 48px;
  height: 48px;
  box-shadow: ${(props) => props.theme.shadowHigher};

  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
    position: sticky;
    display: block;
    margin-top: calc(100vh + 48px);
    margin-left: auto;
    width: 36px;
    height: 36px;
    bottom: 12px;
    margin-right: 12px;
  }

  background: ${(props) => props.theme.buttonPrimaryBackground};

  &:hover,
  &:focus-visible {
    background: ${(props) => props.theme.buttonPrimaryHover};
    color: ${(props) => props.theme.textMain};
  }

  &:active {
    background: ${(props) => props.theme.buttonPrimaryClicked};
  }
`;

const Icon = styled(FontAwesomeIcon)`
  color: ${(props) => props.theme.buttonPrimaryText};
  font-size: ${(props) => props.theme.iconSizeNormal};

  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
    font-size: ${(props) => props.theme.iconSizeSmall};
  }
`;
