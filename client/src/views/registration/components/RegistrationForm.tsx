import React, { ReactElement } from 'react';
import { Field, reduxForm, InjectedFormProps } from 'redux-form';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { FormField } from 'client/components/FormField';
import {
  passwordLength,
  required,
  usernameLength,
} from 'client/utils/validate';
import { Accordion } from 'client/components/Accordion';
import { sharedConfig } from 'shared/config/sharedConfig';
import { ConventionType } from 'shared/config/sharedConfig.types';
import { Button } from 'client/components/Button';
import { Paragraph } from 'client/components/Paragraph';

const RegistrationForm = (props: InjectedFormProps): ReactElement => {
  const { handleSubmit, submitting, error } = props;
  const { t } = useTranslation();
  const serialRequired = sharedConfig.conventionType === ConventionType.LIVE;
  return (
    <div className='registration-form'>
      <h2>{t('pageTitle.registration')}</h2>

      <form onSubmit={handleSubmit}>
        <NotificationMessage>
          {t('pageTitle.usernamePublicWarning')}.{' '}
          {t('pageTitle.usernameDiscordInfo')}.
        </NotificationMessage>

        <Field
          name='username'
          type='text'
          component={FormField}
          validate={[required, usernameLength]}
        />

        <Field
          name='password'
          type='password'
          component={FormField}
          validate={[required, passwordLength]}
        />

        {serialRequired && (
          <div>
            <Field
              name='serial'
              id='serial'
              type='text'
              component={FormField}
              validate={required}
            />
            <label htmlFor='serial' className='small'>
              {t('registrationSerialHelp')}
            </label>
          </div>
        )}

        <Field
          name='agreePrivacyPolicy'
          id='agreePrivacyPolicy'
          type='checkbox'
          component={FormField}
          validate={required}
        />

        <Accordion toggleButton={t('privacyPolicyButton')}>
          <h3>{t(`privacyPolicyTitle`)}</h3>
          <Paragraph text={t('privacyPolicyText')} />
        </Accordion>

        <Button type='submit' disabled={submitting}>
          {t('button.register')}
        </Button>
      </form>

      {typeof error === 'string' && error && (
        <ErrorMessage>{error}</ErrorMessage>
      )}
    </div>
  );
};

export default reduxForm({
  form: 'registration',
})(RegistrationForm);

const NotificationMessage = styled.p`
  color: ${(props) => props.theme.warning};
`;

const ErrorMessage = styled.span`
  font-weight: bold;
  color: ${(props) => props.theme.error};
`;
