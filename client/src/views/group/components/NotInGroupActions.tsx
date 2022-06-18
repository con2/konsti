import React, { ChangeEvent, ReactElement, useState } from "react";
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
import { ErrorMessage } from "client/components/ErrorMessage";

interface Props {
  username: string;
  serial: string;
}

export const NotInGroupActions = ({
  username,
  serial,
}: Props): ReactElement => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const [loading, setLoading] = useState<boolean>(false);
  const [showCreateGroup, setShowCreateGroup] = useState<boolean>(false);
  const [showJoinGroup, setShowJoinGroup] = useState<boolean>(false);
  const [joinGroupValue, setJoinGroupValue] = useState<string>("");
  const [serverError, setServerError] = useState<PostGroupErrorMessage>(
    PostGroupErrorMessage.EMPTY
  );

  const openCreateGroup = (): void => {
    setServerError(PostGroupErrorMessage.EMPTY);
    setShowCreateGroup(true);
    setShowJoinGroup(false);
  };

  const openJoinGroup = (): void => {
    setServerError(PostGroupErrorMessage.EMPTY);
    setShowJoinGroup(true);
    setShowCreateGroup(false);
  };

  const createGroup = async (): Promise<void> => {
    setLoading(true);
    const groupRequest: GroupRequest = {
      username: username,
      groupCode: serial,
      isGroupCreator: true,
      ownSerial: serial,
    };

    const errorMessage = await dispatch(submitCreateGroup(groupRequest));

    if (errorMessage) {
      setServerError(errorMessage);
    } else {
      setServerError(PostGroupErrorMessage.EMPTY);
      setShowCreateGroup(false);
    }

    setLoading(false);
  };

  const joinGroup = async (): Promise<void> => {
    setLoading(true);

    const groupRequest: GroupRequest = {
      username: username,
      groupCode: joinGroupValue,
      isGroupCreator: false,
      ownSerial: serial,
    };

    const errorMessage = await dispatch(submitJoinGroup(groupRequest));

    if (errorMessage) {
      setServerError(errorMessage);
    } else {
      setServerError(PostGroupErrorMessage.EMPTY);
      setShowCreateGroup(false);
    }

    setLoading(false);
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
        onClick={() => openCreateGroup()}
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
