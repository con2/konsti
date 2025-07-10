import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Link } from "react-router";
import KompassiLogo from "client/components/icons/kompassi.svg";
import KonstiLogo from "client/components/icons/konsti.svg";
import { RaisedCard } from "client/components/RaisedCard";
import { KompassiLoginButton } from "client/views/login/components/KompassiLoginButton";
import { LocalLoginForm } from "client/views/login/components/LocalLoginForm";

export const KompassiAndLocalLogin = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <Container>
      {t("loginView.kompassiAndLocalLoginHint")}
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
        <LocalLoginForm />
        <Link to={"/registration"}>
          <StyledP>{t("loginView.noAccountRegister")}</StyledP>
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

const StyledP = styled.p`
  margin-bottom: 4px;
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;
