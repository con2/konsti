import React, { ReactElement, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, ButtonStyle } from "client/components/Button";
import { GroupRequest } from "shared/typings/api/groups";
import { useAppDispatch } from "client/utils/hooks";
import {
  PostGroupErrorMessage,
  submitLeaveGroup,
} from "client/views/group/groupThunks";
import { ErrorMessage } from "client/components/ErrorMessage";

interface Props {
  username: string;
  groupCode: string;
  serial: string;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setShowJoinGroup: React.Dispatch<React.SetStateAction<boolean>>;
  loading: boolean;
}

export const GroupMemberActions = ({
  username,
  groupCode,
  serial,
  setLoading,
  setShowJoinGroup,
  loading,
}: Props): ReactElement => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

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

  const leaveGroup = async (): Promise<void> => {
    setLoading(true);

    const groupRequest: GroupRequest = {
      username: username,
      groupCode: groupCode,
      isGroupCreator: false,
      ownSerial: serial,
      leaveGroup: true,
    };

    const errorMessage = await dispatch(submitLeaveGroup(groupRequest));

    if (errorMessage) {
      setServerError(errorMessage);
      setLoading(false);
      return;
    }

    setShowJoinGroup(false);
    setLoading(false);
  };

  return (
    <>
      <Button
        buttonStyle={loading ? ButtonStyle.DISABLED : ButtonStyle.NORMAL}
        onClick={async () => await leaveGroup()}
      >
        {t("button.leaveGroup")}
      </Button>

      {serverError && (
        <ErrorMessage
          message={t(serverError)}
          closeError={() => setServerError(PostGroupErrorMessage.EMPTY)}
        />
      )}
    </>
  );
};
