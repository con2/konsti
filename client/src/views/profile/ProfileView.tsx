import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import styled from "styled-components";
import { formatSerial } from "shared/utils/formatSerial";
import { AppRoute } from "client/app/routes";
import { Button, ButtonStyle } from "client/components/Button";
import { PasswordChangeForm } from "client/components/PasswordChangeForm";
import { useAppSelector } from "client/utils/hooks";
import { EmailSettingsForm } from "client/views/profile/components/EmailSettingsForm";

export const ProfileView = (): ReactElement => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const username = useAppSelector((state) => state.login.username);
  const serial = useAppSelector((state) => state.login.serial);
  const email = useAppSelector((state) => state.login.email);

  const kompassiId = useAppSelector((state) => state.login.kompassiId);
  const isLocalLogin = !kompassiId;

  return (
    <Container>
      <UserInfoContainer>
        <span>
          <b>{t("user")}:</b> {username}
        </span>
        {isLocalLogin && (
          <span>
            <b>{t("code")}:</b> {formatSerial(serial)}
          </span>
        )}
        <StyledButton
          buttonStyle={ButtonStyle.SECONDARY}
          onClick={() => navigate(AppRoute.LOGOUT)}
        >
          {t("button.logout")}
        </StyledButton>
      </UserInfoContainer>
      <EmailSettingsForm email={email} />
      <PasswordChangeForm
        isLocalLogin={isLocalLogin}
        usernameToUpdate={username}
      />
    </Container>
  );
};

const UserInfoContainer = styled.div`
  display: grid;
  row-gap: 12px;
  margin-bottom: 24px;
`;

const Container = styled.div`
  margin: 16px 0 16px 0;
  padding: 16px 8px 16px 8px;
`;

const StyledButton = styled(Button)`
  width: fit-content;
`;
