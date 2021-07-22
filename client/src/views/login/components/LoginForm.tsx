import React, { ReactElement, useState } from 'react';
import { Field, reduxForm, InjectedFormProps } from 'redux-form';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { required } from 'client/utils/validate';
import { FormField } from 'client/components/FormField';
import { Button } from 'client/components/Button';
import { PasswordManagement } from 'client/views/helper/components/PasswordManagement';

const LoginForm = (props: InjectedFormProps): ReactElement => {
  const { handleSubmit, submitting, error } = props;
  const { t } = useTranslation();
  const [showChangePassword, setShowChangePassword] = useState<boolean>(false);

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

      <Button onClick={() => setShowChangePassword(!showChangePassword)}>
        {t('login.forgotPassword')}
      </Button>

      {showChangePassword && <PasswordManagement allowUsernameSearch={false} />}
    </div>
  );
};

export default reduxForm({
  form: 'login',
})(LoginForm);

const ErrorMessage = styled.span`
  font-weight: bold;
  color: ${(props) => props.theme.error};
`;
