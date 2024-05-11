import { ReactElement, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { ProgramItem } from "shared/types/models/programItem";
import { LotterySignupForm } from "./LotterySignupForm";
import {
  PostLotterySignupsErrorMessage,
  submitPostLotterySignups,
} from "client/views/my-program-items/myProgramItemsThunks";
import { Signup } from "shared/types/models/user";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import {
  getSignupOpensDate,
  isAlreadyLotterySigned,
} from "./allProgramItemsUtils";
import { Button, ButtonStyle } from "client/components/Button";
import { ErrorMessage } from "client/components/ErrorMessage";
import { CancelSignupForm } from "client/views/all-program-items/components/CancelSignupForm";
import { getTimeNow } from "client/utils/getTimeNow";
import { config } from "shared/config";
import { SignupStrategy } from "shared/config/sharedConfigTypes";
import { getAlgorithmSignupStartTime } from "shared/utils/signupTimes";
import { getIsInGroup } from "client/views/group/groupUtils";

interface Props {
  programItem: ProgramItem;
  startTime: string;
  lotterySignups: readonly Signup[];
}

enum ClientError {
  GROUP_TOO_BIG = "group.groupTooBigWarning",
}

export const AlgorithmSignupForm = ({
  programItem,
  startTime,
  lotterySignups,
}: Props): ReactElement | null => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const loggedIn = useAppSelector((state) => state.login.loggedIn);
  const groupMembers = useAppSelector((state) => state.group.groupMembers);
  const isGroupCreator = useAppSelector((state) => state.group.isGroupCreator);
  const groupCode = useAppSelector((state) => state.group.groupCode);
  const isInGroup = getIsInGroup(groupCode);
  const canSignToProgramItems = !isInGroup || isGroupCreator;

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
      (g: Signup) =>
        g.programItem.programItemId !== programItemToRemove.programItemId,
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
    (p) => p.programItem.programItemId === programItem.programItemId,
  )?.priority;

  const lotterySignupsForTimeslot = lotterySignups.filter(
    (p) => p.programItem.startTime === startTime,
  );

  const alreadySignedToProgramItem = isAlreadyLotterySigned(
    programItem,
    lotterySignups,
  );

  const algorithmSignupStartTime = getAlgorithmSignupStartTime(startTime);

  const timeNow = getTimeNow();
  const lotterySignupOpen =
    timeNow.isSameOrAfter(algorithmSignupStartTime) ||
    config.shared().manualSignupMode === SignupStrategy.ALGORITHM;

  if (!loggedIn) {
    return (
      <NotLoggedSignupInfo>
        <div>
          {!lotterySignupOpen && (
            <>
              <span>{t("signup.lotterySignupOpens")}</span>{" "}
              <BoldText>
                {getSignupOpensDate(algorithmSignupStartTime, timeNow)}
              </BoldText>
            </>
          )}
          {lotterySignupOpen && <span>{t("signup.lotterySignupOpenNow")}</span>}
        </div>
        <CreateAccountLink>
          <Link to={`/login`}>{t("signup.loginToSignup")}</Link>
        </CreateAccountLink>
      </NotLoggedSignupInfo>
    );
  }

  return (
    <>
      {config.shared().signupOpen &&
        !alreadySignedToProgramItem &&
        canSignToProgramItems && (
          <>
            {lotterySignupsForTimeslot.length >= 3 && (
              <p>{t("signup.cannotLotterySignupMoreProgramItems")}</p>
            )}

            {!lotterySignupOpen && (
              <p>
                {t("signup.lotterySignupOpens")}{" "}
                <BoldText>
                  {getSignupOpensDate(algorithmSignupStartTime, timeNow)}
                </BoldText>
              </p>
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
          <LotterySignupContainer>
            {t("signup.alreadyLotterySigned", {
              CURRENT_PRIORITY: currentPriority,
            })}
          </LotterySignupContainer>

          {config.shared().signupOpen && (
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
        />
      )}
    </>
  );
};

const LotterySignupContainer = styled.div`
  border: 1px solid ${(props) => props.theme.infoBorder};
  padding: 8px 6px;
  margin-bottom: 8px;
  border-radius: 5px;
  border-left: 5px solid ${(props) => props.theme.infoBorder};
  background-color: ${(props) => props.theme.infoBackground};
`;

const BoldText = styled.span`
  font-weight: 600;
`;

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
