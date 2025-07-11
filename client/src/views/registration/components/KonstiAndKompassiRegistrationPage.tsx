import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import KompassiLogo from "client/components/icons/kompassi.svg";
import KonstiLogo from "client/components/icons/konsti.svg";
import { RaisedCard } from "client/components/RaisedCard";
import { KompassiLoginButton } from "client/views/login/components/KompassiLoginButton";
import { KonstiRegistrationForm } from "client/views/registration/components/KonstiRegistrationForm";

export const KonstiAndKompassiRegistrationPage = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <Container>
      <StyledH2>{t("pageTitle.registration")}</StyledH2>
      <StyledP>{t("registrationView.kompassiAndKonstiInfo")}</StyledP>
      <StyledCard>
        <KompassiHeader>
          <KompassiIcon aria-hidden={true} />
          {t("registrationView.kompassiAccount")}
        </KompassiHeader>
        <ButtonContainer>
          <KompassiLoginButton />
        </ButtonContainer>
      </StyledCard>
      <StyledCard>
        <StyledH3>
          <KonstiIcon aria-hidden={true} />
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

const StyledP = styled.p`
  margin-bottom: 4px;
`;

const StyledH2 = styled.h2`
  margin-bottom: 4px;
  margin-top: 10px;
`;

const StyledH3 = styled.h3`
  margin-top: 0;
`;

const KompassiHeader = styled(StyledH3)`
  margin-bottom: 8px;
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

const KompassiIcon = styled(KompassiLogo)`
  width: 24px;
  height: 24px;
  vertical-align: middle;
  padding-right: 4px;
`;

const KonstiIcon = styled(KonstiLogo)`
  width: 24px;
  height: 24px;
  vertical-align: middle;
  padding-right: 4px;
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;
