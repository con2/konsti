import React, { FC, ReactElement } from 'react';
import { Field, reduxForm, InjectedFormProps } from 'redux-form';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { required } from 'utils/validate';
import { FormField } from 'components/FormField';

const LoginForm: FC<InjectedFormProps> = (
  props: InjectedFormProps
): ReactElement => {
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

        <button type='submit' disabled={submitting}>
          {t('button.login')}
        </button>
      </form>

      {typeof error === 'string' && error && (
        <ErrorMessage>{error}</ErrorMessage>
      )}
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
