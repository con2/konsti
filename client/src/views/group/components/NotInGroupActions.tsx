import React, { ChangeEvent, ReactElement, useEffect, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Button, ButtonStyle } from "client/components/Button";
import {
  PostGroupErrorMessage,
  submitCreateGroup,
  submitJoinGroup,
} from "client/views/group/groupThunks";
import { useAppDispatch } from "client/utils/hooks";
import { GroupRequest } from "shared/typings/api/groups";
import { submitPostSignedGames } from "client/views/my-games/myGamesThunks";
import { ErrorMessage } from "client/components/ErrorMessage";

interface Props {
  showCreateGroup: boolean;
  showJoinGroup: boolean;
  setShowCreateGroup: React.Dispatch<React.SetStateAction<boolean>>;
  setShowJoinGroup: React.Dispatch<React.SetStateAction<boolean>>;
  username: string;
  serial: string;
  loading: boolean;
}

export const NotInGroupActions = ({
  showCreateGroup,
  showJoinGroup,
  setShowCreateGroup,
  setShowJoinGroup,
  username,
  serial,
  loading,
}: Props): ReactElement => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const [joinGroupValue, setJoinGroupValue] = useState<string>("");
  const [serverError, setServerError] = useState<PostGroupErrorMessage>(
    PostGroupErrorMessage.EMPTY
  );

  useEffect(() => {
    return () => {
      if (serverError !== PostGroupErrorMessage.EMPTY) {
        setServerError(PostGroupErrorMessage.EMPTY);
      }
    };
  });

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

    const errorMessage = await dispatch(submitCreateGroup(groupRequest));

    if (errorMessage) {
      setServerError(errorMessage);
    }
  };

  const joinGroup = async (): Promise<void> => {
    const groupRequest: GroupRequest = {
      username: username,
      groupCode: joinGroupValue,
      isGroupCreator: false,
      ownSerial: serial,
    };

    const errorMessage = await dispatch(submitJoinGroup(groupRequest));

    if (errorMessage) {
      setServerError(errorMessage);
      return;
    }

    await removeSignedGames();
  };

  const removeSignedGames = async (): Promise<void> => {
    const signupData = {
      username,
      selectedGames: [],
      signupTime: "all",
    };

    await dispatch(submitPostSignedGames(signupData));
  };

  const handleJoinGroupChange = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    setJoinGroupValue(event.target.value);
  };

  return (
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
        buttonStyle={showJoinGroup ? ButtonStyle.DISABLED : ButtonStyle.NORMAL}
        onClick={() => openJoinGroup()}
      >
        {t("button.joinGroup")}
      </Button>

      {showCreateGroup && (
        <>
          <p>{t("group.createGroupConfirmationMessage")}</p>
          <Button
            buttonStyle={loading ? ButtonStyle.DISABLED : ButtonStyle.NORMAL}
            onClick={async () => await createGroup()}
          >
            {t("button.joinGroupConfirmation")}
          </Button>
        </>
      )}

      {showJoinGroup && (
        <>
          <InfoTextParagraph>
            {t("group.joiningGroupWillCancelGames")}
          </InfoTextParagraph>

          <FormInput
            key="joinGroup"
            placeholder={t("group.enterGroupCreatorCode")}
            value={joinGroupValue}
            onChange={handleJoinGroupChange}
          />

          <Button
            buttonStyle={loading ? ButtonStyle.DISABLED : ButtonStyle.NORMAL}
            onClick={async () => await joinGroup()}
          >
            {t("button.joinGroup")}
          </Button>
        </>
      )}

      {serverError && (
        <ErrorMessage
          message={t(serverError)}
          closeError={() => setServerError(PostGroupErrorMessage.EMPTY)}
        />
      )}
    </>
  );
};

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
