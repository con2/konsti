import React, { FC, ReactElement, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector, useStore } from 'react-redux';
import styled from 'styled-components';
import {
  submitJoinGroup,
  submitCreateGroup,
  submitLeaveGroup,
} from 'views/group/groupActions';
import { GroupMembersList } from 'views/group/components/GroupMembersList';
import { sleep } from 'utils/sleep';
import { config } from 'config';
import { submitSignup } from 'views/signup/signupActions';
import { loadGroupMembers } from 'utils/loadData';
import { GroupMember } from 'typings/group.typings';

import { RootState } from 'typings/redux.typings';

export const GroupView: FC = (): ReactElement => {
  const username: string = useSelector(
    (state: RootState) => state.login.username
  );
  const serial: string = useSelector((state: RootState) => state.login.serial);
  const groupCode: string = useSelector(
    (state: RootState) => state.login.groupCode
  );
  const groupMembers: readonly GroupMember[] = useSelector(
    (state: RootState) => state.login.groupMembers
  );
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const [loading, setLoading] = React.useState<boolean>(false);
  const [showCreateGroup, setShowCreateGroup] = React.useState<boolean>(false);
  const [showJoinGroup, setShowJoinGroup] = React.useState<boolean>(false);
  const [joinGroupValue, setJoinGroupValue] = React.useState<string>('');
  const [message, setMessage] = React.useState<string>('');
  const [messageStyle, setMessageStyle] = React.useState<string>('');
  const [closeGroupConfirmation, setCloseGroupConfirmation] = React.useState<
    boolean
  >(false);

  const store = useStore();

  React.useEffect(() => {
    const fetchData = async (): Promise<void> => {
      await loadGroupMembers();
    };
    fetchData();
  }, [store]);

  const openGroupForming = (): void => {
    setShowCreateGroup(true);
    setShowJoinGroup(false);
  };

  const openJoinGroup = (): void => {
    setShowJoinGroup(true);
    setShowCreateGroup(false);
  };

  const createGroup = async (): Promise<void> => {
    const groupData = {
      username: username,
      groupCode: serial,
      leader: true,
      ownSerial: serial,
    };

    try {
      await dispatch(submitCreateGroup(groupData));
    } catch (error) {
      showMessage({
        message: t('generalCreateGroupError'),
        style: 'error',
      });
      return;
    }

    showMessage({ message: t('groupCreated'), style: 'success' });
  };

  // Remove all signups
  const removeSignups = async (): Promise<void> => {
    const signupData = {
      username,
      selectedGames: [],
      signupTime: 'all',
    };

    await dispatch(submitSignup(signupData));
  };

  const joinGroup = async (): Promise<void> => {
    const groupData = {
      username: username,
      groupCode: joinGroupValue,
      leader: false,
      ownSerial: serial,
    };

    try {
      await dispatch(submitJoinGroup(groupData));
    } catch (error) {
      switch (error.code) {
        case 31:
          showMessage({
            message: t('invalidGroupCode'),
            style: 'error',
          });
          return;
        case 32:
          showMessage({
            message: t('groupNotExist'),
            style: 'error',
          });
          return;
        default:
          showMessage({
            message: t('generalCreateGroupError'),
            style: 'error',
          });
          return;
      }
    }

    showMessage({ message: t('groupJoined'), style: 'success' });
    await removeSignups();
  };

  const leaveGroup = async ({ leader }: { leader: boolean }): Promise<void> => {
    setLoading(true);

    const groupData = {
      username: username,
      groupCode: groupCode,
      leader,
      ownSerial: serial,
      leaveGroup: true,
    };

    try {
      await dispatch(submitLeaveGroup(groupData));
    } catch (error) {
      switch (error.code) {
        case 36:
          showMessage({
            message: t('groupNotEmpty'),
            style: 'error',
          });
          return;
        default:
          showMessage({
            message: t('generalLeaveGroupError'),
            style: 'error',
          });
          return;
      }
    }

    showMessage({ message: t('leftGroup'), style: 'success' });
    setShowJoinGroup(false);
    setLoading(false);
  };

  const toggleCloseGroupConfirmation = (value: boolean): void => {
    setCloseGroupConfirmation(value);
  };

  const closeGroup = async ({ leader }: { leader: boolean }): Promise<void> => {
    setLoading(true);
    const groupData = {
      username: username,
      groupCode: groupCode,
      leader,
      ownSerial: serial,
      leaveGroup: true,
      closeGroup: true,
    };

    try {
      await dispatch(submitLeaveGroup(groupData));
    } catch (error) {
      showMessage({
        message: t('generalLeaveGroupError'),
        style: 'error',
      });
    }

    showMessage({ message: t('closedGroup'), style: 'success' });
    toggleCloseGroupConfirmation(false);
    setLoading(false);
  };

  const handleJoinGroupChange = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    setJoinGroupValue(event.target.value);
  };

  const isInGroup = (): boolean => {
    if (groupCode && groupCode !== '0') {
      return true;
    }
    return false;
  };

  const showMessage = async ({
    message,
    style,
  }: {
    message: string;
    style: string;
  }): Promise<void> => {
    setMessage(message);
    setMessageStyle(style);
    await sleep(config.MESSAGE_DELAY);
    setMessage('');
    setMessageStyle('');
  };

  const groupLeader = isGroupLeader(groupCode, serial);
  const inGroup = isInGroup();

  const joinGroupInput = (
    <div>
      <FormInput
        key='joinGroup'
        placeholder={t('enterGroupLeaderCode')}
        value={joinGroupValue}
        onChange={handleJoinGroupChange}
      />
    </div>
  );

  return (
    <div className='group-view'>
      <h2>{t('pages.group')}</h2>

      <div className='group-instructions'>
        <p>{t('groupSignupGuide')}</p>
      </div>

      {groupCode === '0' && !inGroup && (
        <>
          <StyledButton
            disabled={loading}
            className={showCreateGroup ? 'active' : ''}
            onClick={() => openGroupForming()}
          >
            {t('button.createGroup')}
          </StyledButton>

          <StyledButton
            disabled={loading}
            className={showJoinGroup ? 'active' : ''}
            onClick={() => openJoinGroup()}
          >
            {t('button.joinGroup')}
          </StyledButton>

          <GroupStatusMessage className={messageStyle}>
            {message}
          </GroupStatusMessage>

          {showCreateGroup && (
            <div>
              <p>{t('createGroupConfirmationMessage')}</p>
              <p>{t('groupLeaderWarning')}</p>
              <button
                disabled={loading}
                onClick={async () => await createGroup()}
              >
                {t('button.joinGroupConfirmation')}
              </button>
            </div>
          )}

          {showJoinGroup && (
            <div>
              <p className='bold'>{t('joiningGroupWillCancelGames')}</p>

              {joinGroupInput}
              <button
                disabled={loading}
                onClick={async () => await joinGroup()}
              >
                {t('button.joinGroup')}
              </button>
            </div>
          )}
        </>
      )}

      {groupLeader && inGroup && (
        <div className='group-info'>
          <p className='group-leader-info'>
            <span className='bold'>{t('youAreGroupLeader')}</span>.{' '}
            {t('groupLeaderInfo')}
          </p>
        </div>
      )}

      {!groupLeader && inGroup && (
        <div className='group-info'>
          <p>
            <span className='bold'>{t('youAreInGroup')}</span>.{' '}
            {t('groupMemberInfo')}
          </p>
        </div>
      )}

      {inGroup && (
        <>
          <div className='group-controls'>
            {!groupLeader && (
              <button
                disabled={loading}
                onClick={async () => await leaveGroup({ leader: groupLeader })}
              >
                {t('button.leaveGroup')}
              </button>
            )}

            {groupLeader && (
              <>
                <div>
                  <button
                    disabled={loading}
                    onClick={() => toggleCloseGroupConfirmation(true)}
                  >
                    {t('button.closeGroup')}
                  </button>

                  <GroupStatusMessage className={messageStyle}>
                    {message}
                  </GroupStatusMessage>
                </div>
                {closeGroupConfirmation && (
                  <div>
                    <p>{t('closeGroupConfirmation')}</p>
                    <button
                      disabled={loading}
                      onClick={() => toggleCloseGroupConfirmation(false)}
                    >
                      {t('button.cancel')}
                    </button>

                    <WarningButton
                      disabled={loading}
                      onClick={async () =>
                        await closeGroup({ leader: groupLeader })
                      }
                    >
                      {t('button.closeGroup')}
                    </WarningButton>
                  </div>
                )}
              </>
            )}
          </div>

          <h3>{t('groupMembers')}</h3>
          <GroupMembersList groupMembers={groupMembers} />
        </>
      )}
    </div>
  );
};

export const isGroupLeader = (groupCode: string, serial: string): boolean => {
  if (groupCode === serial) {
    return true;
  }
  if (groupCode === '0') {
    return true;
  }
  return false;
};

const GroupStatusMessage = styled.span`
  font-weight: 600;
`;

const StyledButton = styled.button`
  &.active {
    background-color: ${(props) => props.theme.buttonSelected};
    border: 1px solid ${(props) => props.theme.borderActive};
  }
`;

const WarningButton = styled.button`
  background-color: ${(props) => props.theme.warning};
  color: ${(props) => props.theme.warningButtonText};
`;

const FormInput = styled.input`
  border: 1px solid ${(props) => props.theme.borderInactive};
  color: ${(props) => props.theme.buttonText};
  height: 34px;
  padding: 0 0 0 10px;
  width: 100%;
`;
