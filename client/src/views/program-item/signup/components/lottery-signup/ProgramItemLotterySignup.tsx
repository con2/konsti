import { ReactElement, useState } from "react";
import { useTranslation } from "react-i18next";
import { ProgramItem } from "shared/types/models/programItem";
import { LotterySignupForm } from "client/views/program-item/signup/components/lottery-signup/LotterySignupForm";
import {
  DeleteLotterySignupErrorMessage,
  submitDeleteLotterySignup,
} from "client/views/my-program-items/myProgramItemsThunks";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import {
  getDirectSignupForSlot,
  isAlreadyLotterySigned,
} from "client/views/program-item/programItemUtils";
import { ButtonStyle } from "client/components/Button";
import { getTimeNow } from "client/utils/getTimeNow";
import { getLotterySignupStartTime } from "shared/utils/signupTimes";
import {
  canSignToProgramItems,
  getIsInGroup,
} from "client/views/group/groupUtils";
import {
  DirectSignupWithProgramItem,
  LotterySignupWithProgramItem,
} from "client/views/my-program-items/myProgramItemsSlice";
import { selectGroupMembers } from "client/views/group/groupSlice";
import { startLoading, stopLoading } from "client/state/loading/loadingSlice";
import { LoginToSignupLink } from "client/views/program-item/signup/components/LoginToSignupLink";
import { ProgramItemButton } from "client/views/program-item/components/ProgramItemButton";
import { ProgramItemButtonGroup } from "client/views/program-item/components/ProgramItemButtonGroup";
import { ProgramItemCancelSignupForm } from "client/views/program-item/components/ProgramItemCancelSignupForm";
import { ErrorMessage } from "client/components/ErrorMessage";
import { InfoText } from "client/components/InfoText";

interface Props {
  programItem: ProgramItem;
  lotterySignups: readonly LotterySignupWithProgramItem[];
  directSignups: readonly DirectSignupWithProgramItem[];
}

enum ClientError {
  GROUP_TOO_BIG = "group.groupTooBigWarning",
}

export const ProgramItemLotterySignup = ({
  programItem,
  lotterySignups,
  directSignups,
}: Props): ReactElement | null => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const loggedIn = useAppSelector((state) => state.login.loggedIn);
  const groupMembers = useAppSelector(selectGroupMembers);
  const isGroupCreator = useAppSelector((state) => state.group.isGroupCreator);
  const groupCode = useAppSelector((state) => state.group.groupCode);
  const loading = useAppSelector((state) => state.loading);

  const isInGroup = getIsInGroup(groupCode);
  const userCanSignToProgramItems = canSignToProgramItems(
    isInGroup,
    isGroupCreator,
  );
  const directSignupForSlot = getDirectSignupForSlot(
    directSignups,
    programItem,
  );

  const [signupFormOpen, setSignupFormOpen] = useState(false);
  const [cancelSignupFormOpen, setCancelSignupFormOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<
    ClientError | DeleteLotterySignupErrorMessage | null
  >(null);

  const removeLotterySignup = async (
    programItemToRemove: ProgramItem,
  ): Promise<void> => {
    dispatch(startLoading());

    const error = await dispatch(
      submitDeleteLotterySignup({
        lotterySignupProgramItemId: programItemToRemove.programItemId,
      }),
    );

    if (error) {
      setErrorMessage(error);
    } else {
      setCancelSignupFormOpen(false);
    }
    dispatch(stopLoading());
  };

  const currentPriority = lotterySignups.find(
    (p) => p.programItemId === programItem.programItemId,
  )?.priority;

  const lotterySignupsForTimeslot = lotterySignups.filter(
    (signup) => signup.programItem.startTime === programItem.startTime,
  );

  const alreadySignedToProgramItem = isAlreadyLotterySigned(
    programItem,
    lotterySignups,
  );

  const lotterySignupStartTime = getLotterySignupStartTime(programItem);

  const timeNow = getTimeNow();
  const lotterySignupOpen = timeNow.isSameOrAfter(lotterySignupStartTime);

  if (!loggedIn) {
    return <LoginToSignupLink />;
  }

  return (
    <>
      {isInGroup && !isGroupCreator && (
        <p>{t("group.signupDisabledNotCreator")}</p>
      )}

      {!alreadySignedToProgramItem && userCanSignToProgramItems && (
        <>
          {lotterySignupsForTimeslot.length >= 3 && (
            <p>{t("signup.cannotLotterySignupMoreProgramItems")}</p>
          )}

          {lotterySignupOpen &&
            lotterySignupsForTimeslot.length < 3 &&
            !signupFormOpen && (
              <ProgramItemButtonGroup>
                <ProgramItemButton
                  onClick={() => {
                    if (groupMembers.length > programItem.maxAttendance) {
                      setErrorMessage(ClientError.GROUP_TOO_BIG);
                    } else {
                      setSignupFormOpen(true);
                    }
                  }}
                  buttonStyle={ButtonStyle.PRIMARY}
                  disabled={loading}
                >
                  {t("signup.lotterySignup")}
                </ProgramItemButton>
              </ProgramItemButtonGroup>
            )}
        </>
      )}
      {alreadySignedToProgramItem && (
        <>
          <InfoText>
            {t("signup.alreadyLotterySigned", {
              PROGRAM_TYPE: t(`programTypeSingular.${programItem.programType}`),
              CURRENT_PRIORITY: String(currentPriority),
            })}
          </InfoText>

          {userCanSignToProgramItems && !cancelSignupFormOpen && (
            <ProgramItemButtonGroup>
              <ProgramItemButton
                onClick={() => setCancelSignupFormOpen(true)}
                buttonStyle={ButtonStyle.SECONDARY}
              >
                {t("button.cancelSignup")}
              </ProgramItemButton>
            </ProgramItemButtonGroup>
          )}

          {cancelSignupFormOpen && (
            <ProgramItemCancelSignupForm
              onCancelForm={() => {
                setCancelSignupFormOpen(false);
              }}
              onConfirmForm={async () => await removeLotterySignup(programItem)}
              loading={loading}
            />
          )}
        </>
      )}
      {errorMessage && (
        <ErrorMessage
          message={t(errorMessage)}
          closeError={() => setErrorMessage(null)}
        />
      )}
      {signupFormOpen && !alreadySignedToProgramItem && (
        <LotterySignupForm
          programItem={programItem}
          closeSignupForm={() => setSignupFormOpen(false)}
          directSignupForSlot={directSignupForSlot}
        />
      )}
    </>
  );
};
