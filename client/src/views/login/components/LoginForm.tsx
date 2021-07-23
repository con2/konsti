import React, { ReactElement } from 'react';
import { Field, reduxForm, InjectedFormProps } from 'redux-form';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { required } from 'client/utils/validate';
import { FormField } from 'client/components/FormField';
import { Button } from 'client/components/Button';

const LoginForm = (props: InjectedFormProps): ReactElement => {
  const { handleSubmit, submitting, error } = props;
  const { t } = useTranslation();

  return (
    <div className='login-form'>
      <h2>{t('pageTitle.login')}</h2>
      <form onSubmit={handleSubmit}>
        <Field
          name='username'
          type='text'
          component={FormField}
          validate={required}
        />

        <Field
          name='password'
          type='password'
          component={FormField}
          validate={required}
        />

        <Button type='submit' disabled={submitting} data-testkey='login-button'>
          {t('button.login')}
        </Button>
      </form>

      {typeof error === 'string' && error && (
        <ErrorMessage>{error}</ErrorMessage>
      )}

      <p>{t('login.passwordHint')}</p>
    </div>
  );
};

export default reduxForm({
  form: 'login',
})(LoginForm);

const ErrorMessage = styled.p`
  font-weight: bold;
  color: ${(props) => props.theme.error};
`;
