import { ReactElement } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

export const LoginToSignupLink = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <LinkContainer>
      <Link to={"/login"}>{t("signup.loginToSignup")}</Link>
    </LinkContainer>
  );
};

const LinkContainer = styled.div`
  margin: 8px 0;
`;
