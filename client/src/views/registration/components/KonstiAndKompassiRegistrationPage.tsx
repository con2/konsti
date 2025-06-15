import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import kompassiIcon from "assets/kompassi-logo.svg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router";
import { KonstiRegistrationForm } from "client/views/registration/components/KonstiRegistrationForm";
import { RaisedCard } from "client/components/RaisedCard";
import { InfoText } from "client/components/InfoText";
import { KompassiLogin } from "client/views/login/components/KompassiLogin";

export const KonstiAndKompassiRegistrationPage = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <Container>
      <StyledH2>{t("pageTitle.registration")}</StyledH2>
      <StyledInfoText>
        {t("registrationView.kompassiAndKonstiInfo")}
      </StyledInfoText>
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

const StyledH3 = styled.h3`
  margin-top: 0;
`;

const StyledH2 = styled.h2`
  margin-bottom: 0;
`;

const StyledCard = styled(RaisedCard)`
  margin-top: 8px;
  margin-bottom: 8px;

  @media (min-width: ${(props) => props.theme.breakpointDesktop}) {
    width: 400px;
    padding-left: 24px;
    padding-right: 24px;
  }
`;

const StyledInfoText = styled(InfoText)`
  @media (min-width: ${(props) => props.theme.breakpointDesktop}) {
    width: 448px;
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
