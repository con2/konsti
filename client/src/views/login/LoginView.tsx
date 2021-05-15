import React, { FC, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { SubmissionError } from 'redux-form';
import { submitLogin } from 'client/views/login/loginThunks';
import LoginForm from 'client/views/login/components/LoginForm';
import { LoginFormFields } from 'shared/typings/api/login';
import { useAppDispatch } from 'client/utils/hooks';

export const LoginView: FC = (): ReactElement => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const submit = async (loginFormFields: LoginFormFields): Promise<void> => {
    try {
      await dispatch(submitLogin(loginFormFields));
    } catch (error) {
      switch (error.code) {
        case 21:
          throw new SubmissionError({
            _error: t('error.loginFailed'),
          });
        case 22:
          throw new SubmissionError({
            _error: t('error.loginDisabled'),
          });
        default:
          throw new Error(`submitLogin error: ${error.message}`);
      }
    }
  };

  return (
    <div className='login-view'>
      <LoginForm onSubmit={submit} />
    </div>
  );
};
