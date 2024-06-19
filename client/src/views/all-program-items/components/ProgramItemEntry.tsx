import { ReactElement } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { ProgramItem } from "shared/types/models/programItem";
import { SignupStrategy } from "shared/config/sharedConfigTypes";
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

interface Props {
  programItem: ProgramItem;
  startTime: string;
  attendeeCount: number;
  signupStrategy: SignupStrategy;
  lotterySignups: readonly Signup[];
  directSignups: readonly Signup[];
  isAlwaysExpanded: boolean;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  username: string;
  loggedIn: boolean;
  userGroup: UserGroup;
  favoriteProgramItems: readonly ProgramItem[];
}

export const ProgramItemEntry = ({
  programItem,
  startTime,
  attendeeCount,
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
}: Props): ReactElement => {
  const { t } = useTranslation();

  const signupAlwaysOpen = config
    .shared()
    .directSignupAlwaysOpenIds.includes(programItem.programItemId);

  const isDirectSignupMode =
    config.shared().manualSignupMode === SignupStrategy.DIRECT ||
    signupStrategy === SignupStrategy.DIRECT ||
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
  if (config.client().activeProgramTypes.length > 1) {
    tags.push(t(`programType.${programItem.programType}`));
  }
  if (programItem.gameSystem) {
    tags.push(programItem.gameSystem);
  }

  programItem.languages.map((language) => {
    tags.push(t(`programItemLanguage.${language}`));
  });

  return (
    <StyledCard
      isHighlighted={isProgramItemSigned}
      data-testid="program-item-container"
    >
      <ProgramItemHead
        programItem={programItem}
        attendeeCount={attendeeCount}
        signupStrategy={signupStrategy}
        username={username}
        loggedIn={loggedIn}
        userGroup={userGroup}
        favoriteProgramItems={favoriteProgramItems}
      />
      <ProgramItemView
        programItem={programItem}
        isAlwaysExpanded={isAlwaysExpanded}
      />
      <SignupInfo
        signupStrategy={signupStrategy}
        startTime={startTime}
        lotterySignups={lotterySignups}
        programItem={programItem}
        attendees={attendeeCount}
        loading={loading}
        setLoading={setLoading}
      />
    </StyledCard>
  );
};

const StyledCard = styled(RaisedCard)`
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: ${(props) => props.theme.textLighter};
`;
