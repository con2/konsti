import { ReactElement } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ChangePasswordForm } from "client/views/helper/components/ChangePasswordForm";
import { useAppSelector } from "client/utils/hooks";
import { Button, ButtonStyle } from "client/components/Button";
import { LoginProvider } from "shared/config/eventConfigTypes";

export const ProfileView = (): ReactElement => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const username = useAppSelector((state) => state.login.username);
  const serial = useAppSelector((state) => state.login.serial);
  const loginProvider = useAppSelector((state) => state.admin.loginProvider);

  const isLocalLogin = loginProvider === LoginProvider.LOCAL;

  return (
    <Container>
      <UserInfoContainer>
        <span>
          <b>{t("user")}:</b> {username}
        </span>
        {isLocalLogin && (
          <span>
            <b>{t("code")}:</b> {serial}
          </span>
        )}
        <StyledButton
          buttonStyle={ButtonStyle.SECONDARY}
          onClick={() => navigate("/logout")}
        >
          {t("button.logout")}
        </StyledButton>
      </UserInfoContainer>
      {isLocalLogin && <ChangePasswordForm username={username} />}
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
