import React, { ReactElement, ChangeEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  getUserBySerial,
  updateUserPassword,
} from 'client/services/userServices';

export const PasswordManagement = (): ReactElement => {
  const { t } = useTranslation();

  const [serial, setSerial] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [passwordFieldType, setPasswordFieldType] =
    useState<string>('password');
  const [userSerialInput, setUserSerialInput] = useState<string>('');
  const [changePasswordInput, setChangePasswordInput] = useState<string>('');
  const [changePasswordInputVisible, setChangePasswordInputVisible] =
    useState<boolean>(false);
  const [userFoundMessage, setUserFoundMessage] = useState<string>('');
  const [passwordChangeMessage, setPasswordChangeMessage] =
    useState<string>('');

  const submitGetUser = async (): Promise<void> => {
    const response = await getUserBySerial(userSerialInput);

    if (!response || response.status === 'error') {
      setUserFoundMessage(`${t('userNotFound')}`);
    } else if (response.status === 'success') {
      setUserFoundMessage(`${t('foundUser')}: ${response.username}`);
      setSerial(response.serial);
      setUsername(response.username);
      setChangePasswordInputVisible(true);
    }
  };

  const submitUpdatePassword = async (): Promise<void> => {
    const response = await updateUserPassword(
      username,
      serial,
      changePasswordInput,
      true
    );
    if (!response || response.status === 'error') {
      setPasswordChangeMessage(`${t('changingPasswordError')}`);
    } else if (response.status === 'success') {
      setPasswordChangeMessage(`${t('changingPasswordSuccess')}`);
    }
  };

  const handleSerialChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setUserSerialInput(event.target.value);
  };

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setChangePasswordInput(event.target.value);
  };

  const togglePasswordVisibility = (): void => {
    if (passwordFieldType === 'password') setPasswordFieldType('text');
    else if (passwordFieldType === 'text') setPasswordFieldType('password');
  };

  return (
    <div className='password-management'>
      <h3>{t('helperPasswordManagement')}</h3>
      <div>
        <p>{t('userCode')}</p>
        <FormInput
          key='user-serial'
          placeholder={t('userCode')}
          value={userSerialInput}
          onChange={handleSerialChange}
        />
        <button onClick={submitGetUser}>{t('button.find')}</button>
        <p>{userFoundMessage && <span>{userFoundMessage}</span>}</p>
      </div>

      <div>
        {changePasswordInputVisible && (
          <>
            <p>{t('newPassword')}</p>
            <FormInput
              type={passwordFieldType}
              key='new-password'
              placeholder={t('newPassword')}
              value={changePasswordInput}
              onChange={handlePasswordChange}
            />
            <button onClick={submitUpdatePassword}>{t('button.save')}</button>

            <FormFieldIcon>
              <FontAwesomeIcon
                icon={passwordFieldType === 'password' ? 'eye' : 'eye-slash'}
                onClick={togglePasswordVisibility}
              />
            </FormFieldIcon>

            <p>
              {passwordChangeMessage && <span>{passwordChangeMessage}</span>}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

const FormFieldIcon = styled.span`
  padding: 0 0 0 8px;
  font-size: ${(props) => props.theme.iconSize};
`;

const FormInput = styled.input`
  border: 1px solid ${(props) => props.theme.borderInactive};
  color: ${(props) => props.theme.buttonText};
  height: 34px;
  padding: 0 0 0 10px;
  width: 100%;
`;
