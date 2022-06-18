import React, { ReactElement, useState } from "react";
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
}

export const GroupCreatorActions = ({
  username,
  groupCode,
  serial,
}: Props): ReactElement => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const [loading, setLoading] = useState<boolean>(false);
  const [showCloseGroupConfirmation, setShowCloseGroupConfirmation] =
    useState<boolean>(false);
  const [serverError, setServerError] = useState<PostGroupErrorMessage>(
    PostGroupErrorMessage.EMPTY
  );

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
    } else {
      setServerError(PostGroupErrorMessage.EMPTY);
      setShowCloseGroupConfirmation(false);
    }

    setLoading(false);
  };

  return (
    <>
      <div>
        <Button
          buttonStyle={
            showCloseGroupConfirmation
              ? ButtonStyle.DISABLED
              : ButtonStyle.NORMAL
          }
          onClick={() => setShowCloseGroupConfirmation(true)}
        >
          {t("button.closeGroup")}
        </Button>
      </div>

      {showCloseGroupConfirmation && (
        <div>
          <p>{t("group.closeGroupConfirmation")}</p>
          <Button
            buttonStyle={ButtonStyle.NORMAL}
            onClick={() => setShowCloseGroupConfirmation(false)}
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
