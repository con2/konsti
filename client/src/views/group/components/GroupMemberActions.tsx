import { ReactElement, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "client/components/Button";
import { ErrorMessage } from "client/components/ErrorMessage";
import { ButtonStyle } from "client/components/componentStyles";
import { useAppDispatch } from "client/utils/hooks";
import {
  PostLeaveGroupErrorMessage,
  submitLeaveGroup,
} from "client/views/group/groupThunks";

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
