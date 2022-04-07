import React, { ReactElement, ChangeEvent, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "react-redux";
import styled, { css } from "styled-components";
import {
  submitJoinGroup,
  submitCreateGroup,
  submitLeaveGroup,
} from "client/views/group/groupThunks";
import { GroupMembersList } from "client/views/group/components/GroupMembersList";
import { sleep } from "client/utils/sleep";
import { config } from "client/config";
import { submitSignup } from "client/views/signup/signupThunks";
import { loadGroupMembers } from "client/utils/loadData";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { Button } from "client/components/Button";
import { GroupRequest } from "shared/typings/api/groups";

export const GroupView = (): ReactElement => {
  const username = useAppSelector((state) => state.login.username);
  const serial = useAppSelector((state) => state.login.serial);
  const groupCode = useAppSelector((state) => state.login.groupCode);
  const groupMembers = useAppSelector((state) => state.login.groupMembers);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const [loading, setLoading] = useState<boolean>(false);
  const [showCreateGroup, setShowCreateGroup] = useState<boolean>(false);
  const [showJoinGroup, setShowJoinGroup] = useState<boolean>(false);
  const [joinGroupValue, setJoinGroupValue] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [messageStyle, setMessageStyle] = useState<string>("");
  const [closeGroupConfirmation, setCloseGroupConfirmation] =
    useState<boolean>(false);

  const store = useStore();

  useEffect(() => {
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
    const groupRequest: GroupRequest = {
      username: username,
      groupCode: serial,
      isGroupLeader: true,
      ownSerial: serial,
    };

    try {
      await dispatch(submitCreateGroup(groupRequest));
    } catch (error) {
      showMessage({
        value: t("generalCreateGroupError"),
        style: "error",
      });
      return;
    }

    showMessage({ value: t("groupCreated"), style: "success" });
  };

  // Remove all signups
  const removeSignups = async (): Promise<void> => {
    const signupData = {
      username,
      selectedGames: [],
      signupTime: "all",
    };

    await dispatch(submitSignup(signupData));
  };

  const joinGroup = async (): Promise<void> => {
    const groupRequest: GroupRequest = {
      username: username,
      groupCode: joinGroupValue,
      isGroupLeader: false,
      ownSerial: serial,
    };

    const errorCode = await dispatch(submitJoinGroup(groupRequest));

    if (errorCode) {
      switch (errorCode) {
        case 31:
          showMessage({
            value: t("invalidGroupCode"),
            style: "error",
          });
          return;
        case 32:
          showMessage({
            value: t("groupNotExist"),
            style: "error",
          });
          return;
        default:
          showMessage({
            value: t("generalCreateGroupError"),
            style: "error",
          });
          return;
      }
    }

    showMessage({ value: t("groupJoined"), style: "success" });
    await removeSignups();
  };

  const leaveGroup = async ({
    isGroupLeader,
  }: {
    isGroupLeader: boolean;
  }): Promise<void> => {
    setLoading(true);

    const groupRequest: GroupRequest = {
      username: username,
      groupCode: groupCode,
      isGroupLeader,
      ownSerial: serial,
      leaveGroup: true,
    };

    const errorCode = await dispatch(submitLeaveGroup(groupRequest));

    if (errorCode) {
      switch (errorCode) {
        case 36:
          showMessage({
            value: t("groupNotEmpty"),
            style: "error",
          });
          return;
        default:
          showMessage({
            value: t("generalLeaveGroupError"),
            style: "error",
          });
          return;
      }
    }

    showMessage({ value: t("leftGroup"), style: "success" });
    setShowJoinGroup(false);
    setLoading(false);
  };

  const toggleCloseGroupConfirmation = (value: boolean): void => {
    setCloseGroupConfirmation(value);
  };

  const closeGroup = async ({
    isGroupLeader,
  }: {
    isGroupLeader: boolean;
  }): Promise<void> => {
    setLoading(true);
    const groupRequest: GroupRequest = {
      username: username,
      groupCode: groupCode,
      isGroupLeader,
      ownSerial: serial,
      leaveGroup: true,
      closeGroup: true,
    };

    try {
      await dispatch(submitLeaveGroup(groupRequest));
    } catch (error) {
      showMessage({
        value: t("generalLeaveGroupError"),
        style: "error",
      });
    }

    showMessage({ value: t("closedGroup"), style: "success" });
    toggleCloseGroupConfirmation(false);
    setLoading(false);
  };

  const handleJoinGroupChange = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    setJoinGroupValue(event.target.value);
  };

  const isInGroup = (): boolean => {
    if (groupCode && groupCode !== "0") {
      return true;
    }
    return false;
  };

  const showMessage = async ({
    value,
    style,
  }: {
    value: string;
    style: string;
  }): Promise<void> => {
    setMessage(value);
    setMessageStyle(style);
    await sleep(config.MESSAGE_DELAY);
    setMessage("");
    setMessageStyle("");
  };

  const isGroupLeader = getIsGroupLeader(groupCode, serial);
  const inGroup = isInGroup();

  const joinGroupInput = (
    <div>
      <FormInput
        key="joinGroup"
        placeholder={t("enterGroupLeaderCode")}
        value={joinGroupValue}
        onChange={handleJoinGroupChange}
      />
    </div>
  );

  return (
    <div>
      <h2>{t("pages.group")}</h2>

      <div>
        <p>{t("groupSignupGuide")}</p>
      </div>

      {groupCode === "0" && !inGroup && (
        <>
          <Button
            disabled={loading}
            selected={showCreateGroup}
            onClick={() => openGroupForming()}
          >
            {t("button.createGroup")}
          </Button>

          <Button
            disabled={loading}
            selected={showJoinGroup}
            onClick={() => openJoinGroup()}
          >
            {t("button.joinGroup")}
          </Button>

          <GroupStatusMessage messageStyle={messageStyle}>
            {message}
          </GroupStatusMessage>

          {showCreateGroup && (
            <div>
              <p>{t("createGroupConfirmationMessage")}</p>
              <p>{t("groupLeaderWarning")}</p>
              <Button
                disabled={loading}
                onClick={async () => await createGroup()}
              >
                {t("button.joinGroupConfirmation")}
              </Button>
            </div>
          )}

          {showJoinGroup && (
            <div>
              <InfoTextParagraph>
                {t("joiningGroupWillCancelGames")}
              </InfoTextParagraph>

              {joinGroupInput}
              <Button
                disabled={loading}
                onClick={async () => await joinGroup()}
              >
                {t("button.joinGroup")}
              </Button>
            </div>
          )}
        </>
      )}

      {isGroupLeader && inGroup && (
        <div>
          <p>
            <InfoTextSpan>{t("youAreGroupLeader")}</InfoTextSpan>.{" "}
            {t("groupLeaderInfo")}
          </p>
        </div>
      )}

      {!isGroupLeader && inGroup && (
        <div>
          <p>
            <InfoTextSpan>{t("youAreInGroup")}</InfoTextSpan>.{" "}
            {t("groupMemberInfo")}
          </p>
        </div>
      )}

      {inGroup && (
        <>
          <div>
            {!isGroupLeader && (
              <Button
                disabled={loading}
                onClick={async () => await leaveGroup({ isGroupLeader })}
              >
                {t("button.leaveGroup")}
              </Button>
            )}

            {isGroupLeader && (
              <>
                <div>
                  <Button
                    disabled={loading}
                    onClick={() => toggleCloseGroupConfirmation(true)}
                  >
                    {t("button.closeGroup")}
                  </Button>

                  <GroupStatusMessage messageStyle={messageStyle}>
                    {message}
                  </GroupStatusMessage>
                </div>
                {closeGroupConfirmation && (
                  <div>
                    <p>{t("closeGroupConfirmation")}</p>
                    <Button
                      disabled={loading}
                      onClick={() => toggleCloseGroupConfirmation(false)}
                    >
                      {t("button.cancel")}
                    </Button>

                    <WarningButton
                      disabled={loading}
                      onClick={async () => await closeGroup({ isGroupLeader })}
                    >
                      {t("button.closeGroup")}
                    </WarningButton>
                  </div>
                )}
              </>
            )}
          </div>

          <h3>{t("groupMembers")}</h3>
          <GroupMembersList groupMembers={groupMembers} />
        </>
      )}
    </div>
  );
};

export const getIsGroupLeader = (
  groupCode: string,
  serial: string
): boolean => {
  if (groupCode === serial) {
    return true;
  }
  if (groupCode === "0") {
    return true;
  }
  return false;
};

interface GroupStatusMessageProps {
  messageStyle: string;
}

const GroupStatusMessage = styled.span<GroupStatusMessageProps>`
  font-weight: 600;

  ${(groupStatusMessageProps) =>
    groupStatusMessageProps.messageStyle === "success" &&
    css`
      color: ${(props) => props.theme.success};
    `};

  ${(groupStatusMessageProps) =>
    groupStatusMessageProps.messageStyle === "error" &&
    css`
      color: ${(props) => props.theme.error};
    `};
`;

const WarningButton = styled(Button)`
  background: ${(props) => props.theme.warning};
  color: ${(props) => props.theme.warningButtonText};
`;

const FormInput = styled.input`
  border: 1px solid ${(props) => props.theme.borderInactive};
  color: ${(props) => props.theme.buttonText};
  height: 34px;
  padding: 0 0 0 10px;
  width: 100%;
`;

const InfoTextParagraph = styled.p`
  font-weight: 600;
`;

const InfoTextSpan = styled.span`
  font-weight: 600;
`;
