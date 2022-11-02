import React, { ReactElement, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, ButtonStyle } from "client/components/Button";
import {
  PostCloseGroupErrorMessage,
  submitCloseGroup,
} from "client/views/group/groupThunks";
import { useAppDispatch } from "client/utils/hooks";
import { ErrorMessage } from "client/components/ErrorMessage";

interface Props {
  username: string;
  groupCode: string;
}

export const GroupCreatorActions = ({
  username,
  groupCode,
}: Props): ReactElement => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const [loading, setLoading] = useState<boolean>(false);
  const [showCloseGroupConfirmation, setShowCloseGroupConfirmation] =
    useState<boolean>(false);
  const [serverError, setServerError] =
    useState<PostCloseGroupErrorMessage | null>(null);

  const closeGroup = async (): Promise<void> => {
    setLoading(true);

    const errorMessage = await dispatch(
      submitCloseGroup({
        username,
        groupCode,
      })
    );

    if (errorMessage) {
      setServerError(errorMessage);
    } else {
      setServerError(null);
      setShowCloseGroupConfirmation(false);
    }

    setLoading(false);
  };

  return (
    <>
      <div>
        <Button
          disabled={showCloseGroupConfirmation}
          buttonStyle={ButtonStyle.PRIMARY}
          onClick={() => setShowCloseGroupConfirmation(true)}
        >
          {t("button.closeGroup")}
        </Button>
      </div>

      {showCloseGroupConfirmation && (
        <>
          <p>{t("group.closeGroupConfirmation")}</p>
          <Button
            buttonStyle={ButtonStyle.SECONDARY}
            onClick={() => {
              setShowCloseGroupConfirmation(false);
              setServerError(null);
            }}
          >
            {t("button.cancel")}
          </Button>

          <Button
            disabled={loading}
            buttonStyle={ButtonStyle.PRIMARY}
            onClick={async () => await closeGroup()}
          >
            {t("button.closeGroup")}
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
