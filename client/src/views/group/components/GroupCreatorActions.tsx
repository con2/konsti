import React, { ReactElement, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, ButtonStyle } from "client/components/Button";
import {
  PostGroupErrorMessage,
  submitLeaveGroup,
} from "client/views/group/groupThunks";
import { useAppDispatch } from "client/utils/hooks";
import { ErrorMessage } from "client/components/ErrorMessage";
import { GroupRequest } from "shared/typings/api/groups";

interface Props {
  username: string;
  groupCode: string;
  serial: string;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setShowCreateGroup: React.Dispatch<React.SetStateAction<boolean>>;
}

export const GroupCreatorActions = ({
  username,
  groupCode,
  serial,
  loading,
  setLoading,
  setShowCreateGroup,
}: Props): ReactElement => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const [closeGroupConfirmation, setCloseGroupConfirmation] =
    useState<boolean>(false);
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

  const closeGroup = async (): Promise<void> => {
    setLoading(true);
    const groupRequest: GroupRequest = {
      username: username,
      groupCode: groupCode,
      isGroupCreator: true,
      ownSerial: serial,
      leaveGroup: true,
      closeGroup: true,
    };

    const errorMessage = await dispatch(submitLeaveGroup(groupRequest));

    if (errorMessage) {
      setServerError(errorMessage);
      setLoading(false);
      return;
    }

    toggleCloseGroupConfirmation(false);
    setLoading(false);
  };

  const toggleCloseGroupConfirmation = (value: boolean): void => {
    setCloseGroupConfirmation(value);
    setShowCreateGroup(value);
  };

  return (
    <>
      <div>
        <Button
          buttonStyle={
            closeGroupConfirmation ? ButtonStyle.DISABLED : ButtonStyle.NORMAL
          }
          onClick={() => toggleCloseGroupConfirmation(true)}
        >
          {t("button.closeGroup")}
        </Button>
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
            buttonStyle={loading ? ButtonStyle.DISABLED : ButtonStyle.WARNING}
            onClick={async () => await closeGroup()}
          >
            {t("button.closeGroup")}
          </Button>
        </div>
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
