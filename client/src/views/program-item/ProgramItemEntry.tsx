import { ReactElement } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
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
import {
  DirectSignupWithProgramItem,
  LotterySignupWithProgramItem,
} from "client/views/my-program-items/myProgramItemsSlice";

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
}

export const ProgramItemEntry = ({
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
}: Props): ReactElement => {
  const { t } = useTranslation();
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
    allValuesValid,
  } = getProgramItemValidity(programItem);

  return (
    <StyledCard
      isHighlighted={isProgramItemSigned}
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
          programType={programItem.programType}
        />
      )}

      <ProgramItemBody
        programItem={programItem}
        isAlwaysExpanded={isAlwaysExpanded}
      />

      {cancelled && (
        <CanceledMessage>
          {t("signup.cancelled", {
            PROGRAM_TYPE: t(`programTypeSingular.${programItem.programType}`),
          })}
        </CanceledMessage>
      )}

      {allValuesValid && !cancelled && (
        <ProgramItemSignup
          signupStrategy={signupStrategy}
          lotterySignups={lotterySignups}
          directSignups={directSignups}
          programItem={programItem}
          attendees={signups.length}
          usesKonstiSignup={usesKonstiSignup}
          signupRequired={signupRequired}
        />
      )}
    </StyledCard>
  );
};

const StyledCard = styled(RaisedCard)`
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: ${(props) => props.theme.textLighter};
`;

const CanceledMessage = styled.div`
  font-weight: 600;
`;
