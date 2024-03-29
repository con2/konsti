import { ReactElement, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, ButtonStyle } from "client/components/Button";
import { useAppDispatch } from "client/utils/hooks";
import {
  PostLeaveGroupErrorMessage,
  submitLeaveGroup,
} from "client/views/group/groupThunks";
import { ErrorMessage } from "client/components/ErrorMessage";

export const GroupMemberActions = (): ReactElement => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const [serverError, setServerError] =
    useState<PostLeaveGroupErrorMessage | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const leaveGroup = async (): Promise<void> => {
    setLoading(true);

    const errorMessage = await dispatch(submitLeaveGroup());

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
        disabled={loading}
        buttonStyle={ButtonStyle.PRIMARY}
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
