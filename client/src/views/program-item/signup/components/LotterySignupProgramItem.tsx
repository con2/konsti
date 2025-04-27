import { ReactElement, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Link } from "react-router";
import { ProgramItem } from "shared/types/models/programItem";
import { LotterySignupForm } from "client/views/program-item/signup/components/LotterySignupForm";
import {
  PostLotterySignupsErrorMessage,
  submitPostLotterySignups,
} from "client/views/my-program-items/myProgramItemsThunks";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { isAlreadyLotterySigned } from "client/views/program-item/programItemUtils";
import { Button, ButtonStyle } from "client/components/Button";
import { ErrorMessage } from "client/components/ErrorMessage";
import { CancelSignupForm } from "client/views/program-item/signup/components/CancelSignupForm";
import { getTimeNow } from "client/utils/getTimeNow";
import { config } from "shared/config";
import { getLotterySignupStartTime } from "shared/utils/signupTimes";
import { getIsInGroup } from "client/views/group/groupUtils";
import { InfoText } from "client/components/InfoText";
import {
  DirectSignupWithProgramItem,
  LotterySignupWithProgramItem,
} from "client/views/my-program-items/myProgramItemsSlice";
import { selectGroupMembers } from "client/views/group/groupSlice";

interface Props {
  programItem: ProgramItem;
  startTime: string;
  lotterySignups: readonly LotterySignupWithProgramItem[];
  directSignups: readonly DirectSignupWithProgramItem[];
}

enum ClientError {
  GROUP_TOO_BIG = "group.groupTooBigWarning",
}

export const LotterySignupProgramItem = ({
  programItem,
  startTime,
  lotterySignups,
  directSignups,
}: Props): ReactElement | null => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const loggedIn = useAppSelector((state) => state.login.loggedIn);
  const groupMembers = useAppSelector(selectGroupMembers);
  const isGroupCreator = useAppSelector((state) => state.group.isGroupCreator);
  const groupCode = useAppSelector((state) => state.group.groupCode);
  const isInGroup = getIsInGroup(groupCode);
  const canSignToProgramItems = !isInGroup || isGroupCreator;
  const directSignupForSlot = directSignups.find(
    (signup) => signup.time === startTime,
  );

  const [loading, setLoading] = useState(false);
  const [signupFormOpen, setSignupFormOpen] = useState(false);
  const [cancelSignupFormOpen, setCancelSignupFormOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<
    ClientError | PostLotterySignupsErrorMessage | null
  >(null);

  const removeLotterySignup = async (
    programItemToRemove: ProgramItem,
  ): Promise<void> => {
    setLoading(true);
    const newSignupData = lotterySignups.filter(
      (g) => g.programItemId !== programItemToRemove.programItemId,
    );

    const error = await dispatch(
      submitPostLotterySignups({
        lotterySignups: newSignupData,
        startTime: programItemToRemove.startTime,
      }),
    );

    if (error) {
      setErrorMessage(error);
    } else {
      setCancelSignupFormOpen(false);
      setSignupFormOpen(false);
    }
    setLoading(false);
  };

  const currentPriority = lotterySignups.find(
    (p) => p.programItemId === programItem.programItemId,
  )?.priority;

  const lotterySignupsForTimeslot = lotterySignups.filter(
    (p) => p.programItem.startTime === startTime,
  );

  const alreadySignedToProgramItem = isAlreadyLotterySigned(
    programItem,
    lotterySignups,
  );

  const lotterySignupStartTime = getLotterySignupStartTime(startTime);

  const timeNow = getTimeNow();
  const lotterySignupOpen = timeNow.isSameOrAfter(lotterySignupStartTime);

  if (!loggedIn) {
    return (
      <NotLoggedSignupInfo>
        <CreateAccountLink>
          <Link to={`/login`}>{t("signup.loginToSignup")}</Link>
        </CreateAccountLink>
      </NotLoggedSignupInfo>
    );
  }

  return (
    <>
      {config.event().signupOpen && isInGroup && !isGroupCreator && (
        <p>{t("group.signupDisabledNotCreator")}</p>
      )}

      {config.event().signupOpen &&
        !alreadySignedToProgramItem &&
        canSignToProgramItems && (
          <>
            {lotterySignupsForTimeslot.length >= 3 && (
              <p>{t("signup.cannotLotterySignupMoreProgramItems")}</p>
            )}

            {lotterySignupOpen &&
              lotterySignupsForTimeslot.length < 3 &&
              !signupFormOpen && (
                <ButtonContainer>
                  <StyledButton
                    onClick={() => {
                      if (groupMembers.length > programItem.maxAttendance) {
                        setErrorMessage(ClientError.GROUP_TOO_BIG);
                      } else {
                        setSignupFormOpen(true);
                      }
                    }}
                    buttonStyle={ButtonStyle.PRIMARY}
                  >
                    {t("signup.lotterySignup")}
                  </StyledButton>
                </ButtonContainer>
              )}
          </>
        )}
      {alreadySignedToProgramItem && (
        <>
          <InfoText>
            {t("signup.alreadyLotterySigned", {
              PROGRAM_TYPE: t(`programTypeSingular.${programItem.programType}`),
              CURRENT_PRIORITY: currentPriority,
            })}
          </InfoText>

          {config.event().signupOpen && (
            <>
              {canSignToProgramItems && !cancelSignupFormOpen && (
                <ButtonContainer>
                  <StyledButton
                    onClick={() => setCancelSignupFormOpen(true)}
                    buttonStyle={ButtonStyle.SECONDARY}
                  >
                    {t("button.cancelSignup")}
                  </StyledButton>
                </ButtonContainer>
              )}

              {cancelSignupFormOpen && (
                <CancelSignupForm
                  onCancelForm={() => {
                    setCancelSignupFormOpen(false);
                  }}
                  onConfirmForm={async () =>
                    await removeLotterySignup(programItem)
                  }
                  loading={loading}
                />
              )}
            </>
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
          startTime={startTime}
          onCancel={() => setSignupFormOpen(false)}
          directSignupForSlot={directSignupForSlot}
        />
      )}
    </>
  );
};

const ButtonContainer = styled.div`
  margin: 8px 0;
  display: flex;
  justify-content: center;
`;

const StyledButton = styled(Button)`
  min-width: 400px;
  @media (max-width: ${(props) => props.theme.breakpointDesktop}) {
    width: 100%;
    min-width: 0;
  }
`;

const NotLoggedSignupInfo = styled.div`
  margin: 16px 0;
`;

const CreateAccountLink = styled.div`
  margin: 8px 0 0 0;
`;
