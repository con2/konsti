import React, { ReactElement, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, ButtonStyle } from "client/components/Button";
import { useAppDispatch } from "client/utils/hooks";
import {
  PostLeaveGroupErrorMessage,
  submitLeaveGroup,
} from "client/views/group/groupThunks";
import { ErrorMessage } from "client/components/ErrorMessage";

interface Props {
  username: string;
}

export const GroupMemberActions = ({ username }: Props): ReactElement => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const [serverError, setServerError] =
    useState<PostLeaveGroupErrorMessage | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const leaveGroup = async (): Promise<void> => {
    setLoading(true);

    const errorMessage = await dispatch(
      submitLeaveGroup({
        username,
      })
    );

    if (errorMessage) {
      setServerError(errorMessage);
    } else {
      setServerError(null);
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
          closeError={() => setServerError(null)}
        />
      )}
    </>
  );
};
