import React, { ReactElement, ChangeEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled, { css } from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  getUserBySerial,
  getUserBySerialOrUsername,
  updateUserPassword,
} from 'client/services/userServices';
import { Button } from 'client/components/Button';
import { passwordLength } from 'client/utils/validate';

interface Props {
  allowUsernameSearch: boolean;
}

export const PasswordManagement = ({
  allowUsernameSearch = false,
}: Props): ReactElement => {
  const { t } = useTranslation();

  const [serial, setSerial] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [passwordFieldType, setPasswordFieldType] =
    useState<string>('password');
  const [userSerialInput, setUserSerialInput] = useState<string>('');
  const [changePasswordInput, setChangePasswordInput] = useState<string>('');
  const [changePasswordInputVisible, setChangePasswordInputVisible] =
    useState<boolean>(false);
  const [userFoundMessage, setUserFoundMessage] = useState<ReactElement>(
    <Message />
  );
  const [passwordChangeMessage, setPasswordChangeMessage] =
    useState<ReactElement>(<Message />);

  const submitGetUser = async (): Promise<void> => {
    if (userSerialInput.length === 0) return;

    const response = allowUsernameSearch
      ? await getUserBySerialOrUsername(userSerialInput)
      : await getUserBySerial(userSerialInput);

    if (!response || response.status === 'error') {
      setUserFoundMessage(
        <Message error={true}>{t('passwordManagement.userNotFound')}</Message>
      );
    } else if (response.status === 'success') {
      setUserFoundMessage(
        <Message>
          {t('passwordManagement.foundUser')}: {response.username}
        </Message>
      );
      setSerial(response.serial);
      setUsername(response.username);
      setChangePasswordInputVisible(true);
    }
  };

  const submitUpdatePassword = async (): Promise<void> => {
    const validationError = passwordLength(changePasswordInput);

    if (validationError) {
      setPasswordChangeMessage(
        <Message error={true}>{t(validationError)}</Message>
      );
      return;
    }

    const response = await updateUserPassword(
      username,
      serial,
      changePasswordInput,
      true
    );
    if (!response || response.status === 'error') {
      setPasswordChangeMessage(
        <Message error={true}>
          {t('passwordManagement.changingPasswordError')}
        </Message>
      );
    } else if (response.status === 'success') {
      setPasswordChangeMessage(
        <Message>{t('passwordManagement.changingPasswordSuccess')}</Message>
      );
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
      <h3>{t('passwordManagement.helperPasswordManagement')}</h3>
      <div>
        <p>{t('passwordManagement.userCode')}</p>
        <FormInput
          key='user-serial'
          placeholder={t('passwordManagement.userCode')}
          value={userSerialInput}
          onChange={handleSerialChange}
        />
        <Button onClick={submitGetUser}>{t('button.find')}</Button>

        {userFoundMessage}
      </div>

      <div>
        {changePasswordInputVisible && (
          <>
            <p>{t('passwordManagement.newPassword')}</p>
            <FormInput
              type={passwordFieldType}
              key='new-password'
              placeholder={t('passwordManagement.newPassword')}
              value={changePasswordInput}
              onChange={handlePasswordChange}
            />
            <Button onClick={submitUpdatePassword}>{t('button.save')}</Button>

            <FormFieldIcon>
              <FontAwesomeIcon
                icon={passwordFieldType === 'password' ? 'eye' : 'eye-slash'}
                onClick={togglePasswordVisibility}
              />
            </FormFieldIcon>

            {passwordChangeMessage}
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

interface MessageProps {
  error?: boolean;
}

const Message = styled.p<MessageProps>`
  ${(messageProps) =>
    messageProps.error &&
    css`
      color: ${(props) => props.theme.error};
    `};
`;
