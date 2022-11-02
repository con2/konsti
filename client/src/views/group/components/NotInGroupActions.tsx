import React, { ChangeEvent, ReactElement, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Button, ButtonStyle } from "client/components/Button";
import {
  PostCreateGroupErrorMessage,
  PostJoinGroupErrorMessage,
  submitCreateGroup,
  submitJoinGroup,
} from "client/views/group/groupThunks";
import { useAppDispatch } from "client/utils/hooks";
import { ErrorMessage } from "client/components/ErrorMessage";

interface Props {
  username: string;
  serial: string;
  disabled: boolean;
}

export const NotInGroupActions = ({
  username,
  serial,
  disabled,
}: Props): ReactElement => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const [loading, setLoading] = useState<boolean>(false);
  const [showCreateGroup, setShowCreateGroup] = useState<boolean>(false);
  const [showJoinGroup, setShowJoinGroup] = useState<boolean>(false);
  const [joinGroupValue, setJoinGroupValue] = useState<string>("");
  const [serverError, setServerError] = useState<
    PostJoinGroupErrorMessage | PostCreateGroupErrorMessage | null
  >(null);

  const openCreateGroup = (): void => {
    setServerError(null);
    setShowCreateGroup(true);
    setShowJoinGroup(false);
  };

  const openJoinGroup = (): void => {
    setServerError(null);
    setShowJoinGroup(true);
    setShowCreateGroup(false);
  };

  const createGroup = async (): Promise<void> => {
    setLoading(true);

    const errorMessage = await dispatch(
      submitCreateGroup({
        username,
        groupCode: serial,
      })
    );

    if (errorMessage) {
      setServerError(errorMessage);
    } else {
      setServerError(null);
      setShowCreateGroup(false);
    }

    setLoading(false);
  };

  const joinGroup = async (): Promise<void> => {
    setLoading(true);

    const errorMessage = await dispatch(
      submitJoinGroup({
        username,
        groupCode: joinGroupValue,
        ownSerial: serial,
      })
    );

    if (errorMessage) {
      setServerError(errorMessage);
    } else {
      setServerError(null);
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
        disabled={showCreateGroup || disabled}
        buttonStyle={ButtonStyle.PRIMARY}
        onClick={() => openCreateGroup()}
      >
        {t("button.createGroup")}
      </Button>

      <Button
        disabled={showJoinGroup || disabled}
        buttonStyle={ButtonStyle.PRIMARY}
        onClick={() => openJoinGroup()}
      >
        {t("button.joinGroup")}
      </Button>

      {showCreateGroup && (
        <>
          <p>{t("group.createGroupConfirmationMessage")}</p>
          <Button
            disabled={loading}
            buttonStyle={ButtonStyle.PRIMARY}
            onClick={async () => await createGroup()}
          >
            {t("button.createGroupConfirmation")}
          </Button>
        </>
      )}

      {showJoinGroup && (
        <>
          <InfoTextParagraph>
            {t("group.joiningGroupWillCancelLotterySignups")}
          </InfoTextParagraph>

          <FormInput
            key="joinGroup"
            placeholder={t("group.enterGroupCreatorCode")}
            value={joinGroupValue}
            onChange={handleJoinGroupChange}
          />

          <Button
            disabled={loading}
            buttonStyle={ButtonStyle.PRIMARY}
            onClick={async () => await joinGroup()}
          >
            {t("button.joinGroup")}
          </Button>
        </>
      )}

      {serverError && (
        <ErrorMessage
          message={t(serverError)}
          closeError={() => setServerError(null)}
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
