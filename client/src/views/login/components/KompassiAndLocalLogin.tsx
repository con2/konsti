import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import kompassiIcon from "assets/kompassi-logo.svg";
import { Link } from "react-router";
import { RaisedCard } from "client/components/RaisedCard";
import { KompassiLogin } from "client/views/login/components/KompassiLogin";
import { LocalLoginForm } from "client/views/login/components/LocalLoginForm";

export const KompassiAndLocalLogin = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <Container>
      {t("loginView.kompassiAndLocalLoginHint")}
      <StyledCard>
        <StyledH3>
          <Icon src={kompassiIcon} alt="" />
          {t("registrationView.kompassiAccount")}
        </StyledH3>
        <KompassiLogin />
      </StyledCard>
      <StyledCard>
        <StyledH3>
          <FontIcon icon={"dice"} />
          {t("registrationView.konstiAccount")}
        </StyledH3>
        <LocalLoginForm />
        <Link to={"/registration"}>
          <p>{t("loginView.noAccountRegister")}</p>
        </Link>
      </StyledCard>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`;

const StyledH3 = styled.h3`
  margin-top: 0;
`;

const StyledCard = styled(RaisedCard)`
  margin-top: 12px;
  margin-bottom: 12px;

  @media (min-width: ${(props) => props.theme.breakpointDesktop}) {
    width: 400px;
    padding-left: 24px;
    padding-right: 24px;
  }
`;

const Icon = styled.img`
  width: 24px;
  height: 24px;
  vertical-align: middle;
  padding-right: 4px;
`;

const FontIcon = styled(FontAwesomeIcon)`
  width: 22px;
  height: 22px;
  vertical-align: middle;
  padding-right: 4px;
  color: ${(props) => props.theme.iconDefault};
`;
