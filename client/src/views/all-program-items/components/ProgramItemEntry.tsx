import { ReactElement } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import {
  ProgramItem,
  ProgramItemSignupStrategy,
  UserSignup,
} from "shared/types/models/programItem";
import { Signup, UserGroup } from "shared/types/models/user";
import { RaisedCard } from "client/components/RaisedCard";
import {
  isAlreadyDirectySigned,
  isAlreadyLotterySigned,
} from "client/views/all-program-items/components/allProgramItemsUtils";
import { config } from "shared/config";
import { ProgramItemView } from "client/views/all-program-items/components/ProgramItemView";
import { SignupInfo } from "client/views/all-program-items/components/SignupInfo";
import { ProgramItemHead } from "client/views/all-program-items/components/ProgramItemHead";
import { SignupQuestion } from "shared/types/models/settings";
import { isRevolvingDoorWorkshop } from "client/utils/isRevolvingDoorWorkshop";
import { ProgramItemErrors } from "client/views/all-program-items/components/ProgramItemErrors";
import { EventSignupStrategy } from "shared/config/eventConfigTypes";

interface Props {
  programItem: ProgramItem;
  startTime: string;
  signups: UserSignup[];
  signupStrategy: ProgramItemSignupStrategy;
  lotterySignups: readonly Signup[];
  directSignups: readonly Signup[];
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

  const isDirectSignupMode =
    config.event().manualSignupMode === EventSignupStrategy.DIRECT ||
    signupStrategy === ProgramItemSignupStrategy.DIRECT ||
    signupAlwaysOpen;

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
    isRevolvingDoorWorkshop(programItem) || programItem.maxAttendance > 0;
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
      />

      {!allValuesValid && (
        <ProgramItemErrors
          isValidMinAttendanceValue={isValidMinAttendanceValue}
          isValidMaxAttendanceValue={isValidMaxAttendanceValue}
          programType={programItem.programType}
        />
      )}

      <ProgramItemView
        programItem={programItem}
        isAlwaysExpanded={isAlwaysExpanded}
      />

      {allValuesValid && (
        <SignupInfo
          signupStrategy={signupStrategy}
          startTime={startTime}
          lotterySignups={lotterySignups}
          directSignups={directSignups}
          programItem={programItem}
          attendees={signups.length}
          loading={loading}
          setLoading={setLoading}
          isInGroup={isInGroup}
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
