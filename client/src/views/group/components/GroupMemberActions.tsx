import React, { ReactElement, useState } from "react";
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
}

export const GroupMemberActions = ({
  username,
  groupCode,
  serial,
}: Props): ReactElement => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const [serverError, setServerError] = useState<PostGroupErrorMessage>(
    PostGroupErrorMessage.EMPTY
  );
  const [loading, setLoading] = useState<boolean>(false);

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
    } else {
      setServerError(PostGroupErrorMessage.EMPTY);
    }

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
