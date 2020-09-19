import React, { FC, ReactElement } from 'react';
import { useDispatch } from 'react-redux';
import { SubmissionError } from 'redux-form';
import { useTranslation } from 'react-i18next';
import { submitRegistration } from 'views/registration/registrationActions';
import RegistrationForm from 'views/registration/components/RegistrationForm';
import { RegistrationFormFields } from 'typings/user.typings';

export const RegistrationView: FC = (): ReactElement => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const submit = async (
    registrationFormFields: RegistrationFormFields
  ): Promise<void> => {
    try {
      await dispatch(submitRegistration(registrationFormFields));
    } catch (error) {
      switch (error.code) {
        case 11:
          throw new SubmissionError({
            username: t('error.usernameTaken'),
          });
        case 12:
          throw new SubmissionError({
            serial: t('error.invalidSerial'),
          });
        default:
          throw new Error(`submitRegistration error: ${error.message}`);
      }
    }
  };

  return (
    <div className='registration-view'>
      {/* @ts-expect-error */}
      <RegistrationForm onSubmit={submit} />
    </div>
  );
};
