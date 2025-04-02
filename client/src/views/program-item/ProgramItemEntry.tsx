import { ReactElement } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import {
  ProgramItem,
  ProgramItemSignupStrategy,
  SignupType,
  UserSignup,
} from "shared/types/models/programItem";
import {
  DirectSignup,
  LotterySignup,
  UserGroup,
} from "shared/types/models/user";
import { RaisedCard } from "client/components/RaisedCard";
import {
  isAlreadyDirectySigned,
  isAlreadyLotterySigned,
} from "client/views/program-item/programItemUtils";
import { config } from "shared/config";
import { ProgramItemBody } from "client/views/program-item/body/ProgramItemBody";
import { ProgramItemSignup } from "client/views/program-item/signup/ProgramItemSignup";
import { ProgramItemHead } from "client/views/program-item/head/ProgramItemHead";
import { SignupQuestion } from "shared/types/models/settings";
import { isRevolvingDoorWorkshop } from "client/utils/isRevolvingDoorWorkshop";
import { ProgramItemErrors } from "client/views/program-item/ProgramItemErrors";

interface Props {
  programItem: ProgramItem;
  startTime: string;
  signups: UserSignup[];
  signupStrategy: ProgramItemSignupStrategy;
  lotterySignups: readonly LotterySignup[];
  directSignups: readonly DirectSignup[];
  isAlwaysExpanded: boolean;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  username: string;
  loggedIn: boolean;
  userGroup: UserGroup;
  favoriteProgramItems: readonly ProgramItem[];
  publicSignupQuestion?: SignupQuestion;
  isInGroup: boolean;
}

export const ProgramItemEntry = ({
  programItem,
  startTime,
  signups,
  signupStrategy,
  lotterySignups,
  directSignups,
  isAlwaysExpanded,
  loading,
  setLoading,
  username,
  loggedIn,
  userGroup,
  favoriteProgramItems,
  publicSignupQuestion,
  isInGroup,
}: Props): ReactElement => {
  const { t } = useTranslation();

  const signupAlwaysOpen = config
    .event()
    .directSignupAlwaysOpenIds.includes(programItem.programItemId);

  const usesKonstiSignup =
    !config.event().noKonstiSignupIds.includes(programItem.programItemId) &&
    programItem.signupType === SignupType.KONSTI;
  const requiresSignup = !isRevolvingDoorWorkshop(programItem);
  const isNormalSignup = usesKonstiSignup && requiresSignup;

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

  const isProgramItemSigned = isDirectSignupMode
    ? isDirectlySignedCurrentProgramItem
    : isLotterySignedForCurrentProgramItem;

  const tags = [];
  if (config.client().programTypeSelectOptions.length > 1) {
    tags.push(t(`programType.${programItem.programType}`));
  }
  if (programItem.gameSystem) {
    tags.push(programItem.gameSystem);
  }

  programItem.languages.map((language) => {
    tags.push(t(`programItemLanguage.${language}`));
  });

  const isValidMinAttendanceValue =
    isRevolvingDoorWorkshop(programItem) || programItem.minAttendance > 0;

  const isValidMaxAttendanceValue =
    isRevolvingDoorWorkshop(programItem) ||
    !usesKonstiSignup ||
    programItem.maxAttendance > 0;

  const allValuesValid = isValidMinAttendanceValue && isValidMaxAttendanceValue;

  return (
    <StyledCard
      isHighlighted={isProgramItemSigned}
      data-testid="program-item-container"
    >
      <ProgramItemHead
        programItem={programItem}
        signups={signups}
        signupStrategy={signupStrategy}
        username={username}
        loggedIn={loggedIn}
        userGroup={userGroup}
        favoriteProgramItems={favoriteProgramItems}
        publicSignupQuestion={publicSignupQuestion}
        allValuesValid={allValuesValid}
        isNormalSignup={isNormalSignup}
        requiresSignup={requiresSignup}
      />

      {!allValuesValid && (
        <ProgramItemErrors
          isValidMinAttendanceValue={isValidMinAttendanceValue}
          isValidMaxAttendanceValue={isValidMaxAttendanceValue}
          programType={programItem.programType}
        />
      )}

      <ProgramItemBody
        programItem={programItem}
        isAlwaysExpanded={isAlwaysExpanded}
      />

      {allValuesValid && (
        <ProgramItemSignup
          signupStrategy={signupStrategy}
          startTime={startTime}
          lotterySignups={lotterySignups}
          directSignups={directSignups}
          programItem={programItem}
          attendees={signups.length}
          loading={loading}
          setLoading={setLoading}
          isInGroup={isInGroup}
          usesKonstiSignup={usesKonstiSignup}
          isNormalSignup={isNormalSignup}
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
