import React, { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { LoginForm } from 'client/views/login/components/LoginForm';

export const LoginView = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <div className='login-view'>
      <h2>{t('pageTitle.login')}</h2>

      <LoginForm />

      <p>{t('login.passwordHint')}</p>

      <a href={'https://2021.ropecon.fi/etaropecon/ohjeet/'}>
        {t('discordHint')}
      </a>
    </div>
  );
};
