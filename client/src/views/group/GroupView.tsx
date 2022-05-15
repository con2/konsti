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
import { submitPostSignedGames } from "client/views/my-games/myGamesThunks";
import { loadGroupMembers } from "client/utils/loadData";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { Button, ButtonStyle } from "client/components/Button";
import { GroupRequest } from "shared/typings/api/groups";
import { getIsGroupCreator } from "client/views/group/utils/getIsGroupCreator";

export const GroupView = (): ReactElement => {
  const username = useAppSelector((state) => state.login.username);
  const serial = useAppSelector((state) => state.login.serial);
  const groupCode = useAppSelector((state) => state.group.groupCode);
  const groupMembers = useAppSelector((state) => state.group.groupMembers);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const [loading, setLoading] = useState<boolean>(false);
  const [showCreateGroup, setShowCreateGroup] = useState<boolean>(false);
  const [showJoinGroup, setShowJoinGroup] = useState<boolean>(false);
  const [closeGroupConfirmation, setCloseGroupConfirmation] =
    useState<boolean>(false);
  const [joinGroupValue, setJoinGroupValue] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [messageStyle, setMessageStyle] = useState<string>("");

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
      isGroupCreator: true,
      ownSerial: serial,
    };

    try {
      await dispatch(submitCreateGroup(groupRequest));
    } catch (error) {
      showMessage({
        value: t("group.generalCreateGroupError"),
        style: "error",
      });
      return;
    }

    showMessage({ value: t("group.groupCreated"), style: "success" });
  };

  // Remove all signed games
  const removeSignedGames = async (): Promise<void> => {
    const signupData = {
      username,
      selectedGames: [],
      signupTime: "all",
    };

    await dispatch(submitPostSignedGames(signupData));
  };

  const joinGroup = async (): Promise<void> => {
    const groupRequest: GroupRequest = {
      username: username,
      groupCode: joinGroupValue,
      isGroupCreator: false,
      ownSerial: serial,
    };

    const errorCode = await dispatch(submitJoinGroup(groupRequest));

    if (errorCode) {
      switch (errorCode) {
        case 31:
          showMessage({
            value: t("group.invalidGroupCode"),
            style: "error",
          });
          return;
        case 32:
          showMessage({
            value: t("group.groupNotExist"),
            style: "error",
          });
          return;
        default:
          showMessage({
            value: t("group.generalCreateGroupError"),
            style: "error",
          });
          return;
      }
    }

    showMessage({ value: t("group.groupJoined"), style: "success" });
    await removeSignedGames();
  };

  const leaveGroup = async ({
    isGroupCreator,
  }: {
    isGroupCreator: boolean;
  }): Promise<void> => {
    setLoading(true);

    const groupRequest: GroupRequest = {
      username: username,
      groupCode: groupCode,
      isGroupCreator,
      ownSerial: serial,
      leaveGroup: true,
    };

    const errorCode = await dispatch(submitLeaveGroup(groupRequest));

    if (errorCode) {
      switch (errorCode) {
        case 36:
          showMessage({
            value: t("group.groupNotEmpty"),
            style: "error",
          });
          return;
        default:
          showMessage({
            value: t("group.generalLeaveGroupError"),
            style: "error",
          });
          return;
      }
    }

    showMessage({ value: t("group.leftGroup"), style: "success" });
    setShowJoinGroup(false);
    setLoading(false);
  };

  const toggleCloseGroupConfirmation = (value: boolean): void => {
    setCloseGroupConfirmation(value);
    setShowCreateGroup(value);
  };

  const closeGroup = async ({
    isGroupCreator,
  }: {
    isGroupCreator: boolean;
  }): Promise<void> => {
    setLoading(true);
    const groupRequest: GroupRequest = {
      username: username,
      groupCode: groupCode,
      isGroupCreator,
      ownSerial: serial,
      leaveGroup: true,
      closeGroup: true,
    };

    try {
      await dispatch(submitLeaveGroup(groupRequest));
    } catch (error) {
      showMessage({
        value: t("group.generalLeaveGroupError"),
        style: "error",
      });
    }

    showMessage({ value: t("group.closedGroup"), style: "success" });
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

  const isGroupCreator = getIsGroupCreator(groupCode, serial);
  const inGroup = isInGroup();

  const joinGroupInput = (
    <div>
      <FormInput
        key="joinGroup"
        placeholder={t("group.enterGroupCreatorCode")}
        value={joinGroupValue}
        onChange={handleJoinGroupChange}
      />
    </div>
  );

  return (
    <div>
      <h2>{t("pages.group")}</h2>

      <div>
        <p>{t("group.groupSignupGuide")}</p>
      </div>

      {groupCode === "0" && !inGroup && (
        <>
          <Button
            buttonStyle={
              showCreateGroup ? ButtonStyle.DISABLED : ButtonStyle.NORMAL
            }
            onClick={() => openGroupForming()}
          >
            {t("button.createGroup")}
          </Button>

          <Button
            buttonStyle={
              showJoinGroup ? ButtonStyle.DISABLED : ButtonStyle.NORMAL
            }
            onClick={() => openJoinGroup()}
          >
            {t("button.joinGroup")}
          </Button>

          <GroupStatusMessage messageStyle={messageStyle}>
            {message}
          </GroupStatusMessage>

          {showCreateGroup && (
            <div>
              <p>{t("group.createGroupConfirmationMessage")}</p>
              <Button
                buttonStyle={
                  loading ? ButtonStyle.DISABLED : ButtonStyle.NORMAL
                }
                onClick={async () => await createGroup()}
              >
                {t("button.joinGroupConfirmation")}
              </Button>
            </div>
          )}

          {showJoinGroup && (
            <div>
              <InfoTextParagraph>
                {t("group.joiningGroupWillCancelGames")}
              </InfoTextParagraph>

              {joinGroupInput}
              <Button
                buttonStyle={
                  loading ? ButtonStyle.DISABLED : ButtonStyle.NORMAL
                }
                onClick={async () => await joinGroup()}
              >
                {t("button.joinGroup")}
              </Button>
            </div>
          )}
        </>
      )}

      {isGroupCreator && inGroup && (
        <div>
          <p>
            <InfoTextSpan>{t("group.youAreGroupCreator")}</InfoTextSpan>.{" "}
            {t("group.groupCreatorInfo")}
          </p>
        </div>
      )}

      {!isGroupCreator && inGroup && (
        <div>
          <p>
            <InfoTextSpan>{t("group.youAreInGroup")}</InfoTextSpan>.{" "}
            {t("group.groupMemberInfo")}
          </p>
        </div>
      )}

      {inGroup && (
        <>
          <div>
            {!isGroupCreator && (
              <Button
                buttonStyle={
                  loading ? ButtonStyle.DISABLED : ButtonStyle.NORMAL
                }
                onClick={async () => await leaveGroup({ isGroupCreator })}
              >
                {t("button.leaveGroup")}
              </Button>
            )}

            {isGroupCreator && (
              <>
                <div>
                  <Button
                    buttonStyle={
                      closeGroupConfirmation
                        ? ButtonStyle.DISABLED
                        : ButtonStyle.NORMAL
                    }
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
                    <p>{t("group.closeGroupConfirmation")}</p>
                    <Button
                      buttonStyle={ButtonStyle.NORMAL}
                      onClick={() => toggleCloseGroupConfirmation(false)}
                    >
                      {t("button.cancel")}
                    </Button>

                    <Button
                      buttonStyle={
                        loading ? ButtonStyle.DISABLED : ButtonStyle.WARNING
                      }
                      onClick={async () => await closeGroup({ isGroupCreator })}
                    >
                      {t("button.closeGroup")}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          <h3>{t("group.groupMembers")}</h3>
          <GroupMembersList groupMembers={groupMembers} />
        </>
      )}
    </div>
  );
};

interface GroupStatusMessageProps {
  messageStyle: string;
}

const GroupStatusMessage = styled.span<GroupStatusMessageProps>`
  font-weight: 600;

  ${(groupStatusMessageProps) =>
    groupStatusMessageProps.messageStyle === "success" &&
    css`
      color: ${(props) => props.theme.textSuccess};
    `};

  ${(groupStatusMessageProps) =>
    groupStatusMessageProps.messageStyle === "error" &&
    css`
      color: ${(props) => props.theme.textError};
    `};
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
