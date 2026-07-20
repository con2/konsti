import { memo, ReactElement } from "react";
import styled, { css, keyframes } from "styled-components";
import { useTranslation } from "react-i18next";
import { theme } from "client/theme";
import {
  ProgramItem,
  ProgramItemSignupStrategy,
  SignupType,
  State,
  UserSignup,
} from "shared/types/models/programItem";
import { UserGroup } from "shared/types/models/user";
import { RaisedCard } from "client/components/RaisedCard";
import {
  getProgramItemValidity,
  isAlreadyDirectySigned,
  isAlreadyLotterySigned,
} from "client/views/program-item/programItemUtils";
import { config } from "shared/config";
import { getProgramTypeSelectOptions } from "client/utils/getProgramTypeSelectOptions";
import { ProgramItemBody } from "client/views/program-item/body/ProgramItemBody";
import { ProgramItemSignup } from "client/views/program-item/signup/ProgramItemSignup";
import { ProgramItemHead } from "client/views/program-item/head/ProgramItemHead";
import { SignupQuestion } from "shared/types/models/settings";
import { ProgramItemErrors } from "client/views/program-item/ProgramItemErrors";
import { isDirectSignupAlwaysOpen } from "shared/utils/isDirectSignupAlwaysOpen";
import { useTimeNow } from "client/utils/getTimeNow";
import { getDirectSignupEndTime } from "shared/utils/signupTimes";
import {
  DirectSignupWithProgramItem,
  LotterySignupWithProgramItem,
} from "client/views/my-program-items/myProgramItemsSlice";
import { ProgramItemStatusMessage } from "client/views/program-item/components/ProgramItemStatusMessage";

interface Props {
  programItem: ProgramItem;
  signups: UserSignup[];
  signupStrategy: ProgramItemSignupStrategy;
  lotterySignups: readonly LotterySignupWithProgramItem[];
  directSignups: readonly DirectSignupWithProgramItem[];
  isAlwaysExpanded: boolean;
  username: string;
  loggedIn: boolean;
  userGroup: UserGroup;
  publicSignupQuestion: SignupQuestion | undefined;
  isRecentlyViewed: boolean;
}

export const ProgramItemEntry = memo(function ProgramItemEntryComponent({
  programItem,
  signups,
  signupStrategy,
  lotterySignups,
  directSignups,
  isAlwaysExpanded,
  username,
  loggedIn,
  userGroup,
  publicSignupQuestion,
  isRecentlyViewed,
}: Props): ReactElement {
  const { t } = useTranslation();
  const timeNow = useTimeNow();
  const { noKonstiSignupIds } = config.event();

  const usesKonstiSignup =
    programItem.signupType === SignupType.KONSTI &&
    !noKonstiSignupIds.includes(programItem.programItemId);
  const signupNotRequired = programItem.signupType === SignupType.NOT_REQUIRED;
  const signupRequired = usesKonstiSignup && !signupNotRequired;

  const signupAlwaysOpen = isDirectSignupAlwaysOpen(programItem);
  const isDirectSignupMode =
    signupStrategy === ProgramItemSignupStrategy.DIRECT || signupAlwaysOpen;

  const isDirectlySignedCurrentProgramItem = isAlreadyDirectySigned(
    programItem,
    directSignups,
  );
  const isLotterySignedForCurrentProgramItem = isAlreadyLotterySigned(
    programItem,
    lotterySignups,
  );

  const cancelled = programItem.state === State.CANCELLED;

  const isProgramItemSigned = isDirectSignupMode
    ? isDirectlySignedCurrentProgramItem
    : isLotterySignedForCurrentProgramItem;

  const tags = [];
  if (getProgramTypeSelectOptions().length > 1) {
    tags.push(t(`programType.${programItem.programType}`));
  }
  if (programItem.gameSystem) {
    tags.push(programItem.gameSystem);
  }
  if (config.client().activeLanguages.length > 1) {
    programItem.languages.map((language) => {
      tags.push(t(`programItemLanguage.${language}`));
    });
  }

  const {
    isValidMinAttendanceValue,
    isValidMaxAttendanceValue,
    minAttendanceBiggerThanMax,
    signupTypeMissing,
    allValuesValid,
  } = getProgramItemValidity(programItem);

  const isDirectSignupOver = timeNow.isAfter(
    getDirectSignupEndTime(programItem),
  );

  const showCancelledMessage = cancelled;
  // After direct signup has ended, only signed-up users have content to show
  // in the signup section (the admission ticket link)
  const showSignupSection =
    allValuesValid &&
    !cancelled &&
    (!isDirectSignupOver || isDirectlySignedCurrentProgramItem);

  return (
    <StyledCard
      isHighlighted={isProgramItemSigned}
      $recentlyViewed={isRecentlyViewed}
      data-testid="program-item-container"
    >
      <ProgramItemHead
        programItem={programItem}
        signups={signups}
        username={username}
        loggedIn={loggedIn}
        userGroup={userGroup}
        allValuesValid={allValuesValid}
        signupRequired={signupRequired}
        isDirectSignupMode={isDirectSignupMode}
        publicSignupQuestion={publicSignupQuestion}
        cancelled={cancelled}
      />

      {!allValuesValid && (
        <ProgramItemErrors
          isValidMinAttendanceValue={isValidMinAttendanceValue}
          isValidMaxAttendanceValue={isValidMaxAttendanceValue}
          minAttendanceBiggerThanMax={minAttendanceBiggerThanMax}
          signupTypeMissing={signupTypeMissing}
          programType={programItem.programType}
        />
      )}

      <ProgramItemBody
        programItem={programItem}
        isAlwaysExpanded={isAlwaysExpanded}
        endOfCard={!showCancelledMessage && !showSignupSection}
      />

      {showCancelledMessage && (
        <ProgramItemStatusMessage data-testid="program-item-cancelled">
          {t("signup.cancelled", {
            PROGRAM_TYPE: t(`programTypeSingular.${programItem.programType}`),
          })}
        </ProgramItemStatusMessage>
      )}

      {showSignupSection && (
        <ProgramItemSignup
          signupStrategy={signupStrategy}
          lotterySignups={lotterySignups}
          directSignups={directSignups}
          programItem={programItem}
          attendees={signups.length}
          usesKonstiSignup={usesKonstiSignup}
          signupRequired={signupRequired}
          isDirectSignupOver={isDirectSignupOver}
        />
      )}
    </StyledCard>
  );
});

// Brief glow to point out a just-viewed item on returning to the list. Holds at
// full for a moment, then fades out over the card's resting shadow so nothing
// snaps when it ends
const recentlyViewedFlash = keyframes`
  0%,
  25% {
    box-shadow:
      0 0 0 2px ${theme.borderActive},
      ${theme.shadowLower};
  }
  100% {
    box-shadow:
      0 0 0 2px transparent,
      ${theme.shadowLower};
  }
`;

const StyledCard = styled(RaisedCard)<{ $recentlyViewed: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: ${(props) => props.theme.textLighter};

  ${(props) =>
    props.$recentlyViewed &&
    css`
      animation: ${recentlyViewedFlash} 0.8s ease-out;
    `}
`;
