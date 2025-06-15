import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import kompassiIcon from "assets/kompassi-logo.svg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router";
import { KonstiRegistrationForm } from "client/views/registration/components/KonstiRegistrationForm";
import { RaisedCard } from "client/components/RaisedCard";

export const KonstiAndKompassiRegistrationPage = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <Container>
      <h2>{t("pageTitle.registration")}</h2>
      <p>{t("registrationView.kompassiAndKonstiInfo")}</p>
      <StyledCard>
        <StyledTitle>
          <Icon src={kompassiIcon} alt="" />
          {t("registrationView.kompassiAccount")}
        </StyledTitle>
        <Link to={"/login"}>
          <p>{t("registrationView.linkToLogin")}</p>
        </Link>
      </StyledCard>
      <StyledCard>
        <StyledTitle>
          <FontIcon icon={"dice"} />
          {t("registrationView.konstiAccount")}
        </StyledTitle>
        <KonstiRegistrationForm />
      </StyledCard>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`;

const StyledTitle = styled.h3`
  margin-top: 0;
`;

const StyledCard = styled(RaisedCard)`
  margin-top: 8px;
  margin-bottom: 8px;

  @media (min-width: ${(props) => props.theme.breakpointDesktop}) {
    width: max-content;
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
