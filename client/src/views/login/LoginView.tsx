import React, { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { SubmissionError } from 'redux-form';
import { submitLogin } from 'client/views/login/loginThunks';
import LoginForm from 'client/views/login/components/LoginForm';
import { LoginFormFields } from 'shared/typings/api/login';
import { useAppDispatch } from 'client/utils/hooks';

export const LoginView = (): ReactElement => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const submit = async (loginFormFields: LoginFormFields): Promise<void> => {
    try {
      await dispatch(submitLogin(loginFormFields));
    } catch (error) {
      throw new SubmissionError({
        _error: t(error.message),
      });
    }
  };

  return (
    <div className='login-view'>
      {/* @ts-expect-error: Type '{}' is missing the following properties from type 'LoginFormFields': username, password */}
      <LoginForm onSubmit={submit} />
    </div>
  );
};
