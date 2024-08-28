import { ReactElement } from "react";
import styled from "styled-components";
import { ProgramItem } from "shared/types/models/programItem";
import { DirectSignupProgramItem } from "client/views/all-program-items/components/DirectSignupProgramItem";
import { LotterySignupProgramItem } from "client/views/all-program-items/components/LotterySignupProgramItem";
import { config } from "shared/config";
import { ProgramItemSignupStrategy } from "shared/types/models/programItem";
import { Signup } from "shared/types/models/user";
import { SignupHelpText } from "client/views/all-program-items/components/SignupHelpText";
import { getTimeNow } from "client/utils/getTimeNow";
import { isAlreadyDirectySigned } from "client/views/all-program-items/components/allProgramItemsUtils";
import { AdmissionTicketLink } from "client/views/all-program-items/components/AdmissionTicketLink";

interface Props {
  signupStrategy: ProgramItemSignupStrategy;
  startTime: string;
  lotterySignups: readonly Signup[];
  directSignups: readonly Signup[];
  programItem: ProgramItem;
  attendees: number;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  isInGroup: boolean;
  usesKonstiSignup: boolean;
  isNormalSignup: boolean;
}

export const SignupInfo = ({
  signupStrategy,
  startTime,
  lotterySignups,
  directSignups,
  programItem,
  attendees,
  loading,
  setLoading,
  isInGroup,
  usesKonstiSignup,
  isNormalSignup,
}: Props): ReactElement => {
  const signupAlwaysOpen = config
    .event()
    .directSignupAlwaysOpenIds.includes(programItem.programItemId);

  const isDirectSignupMode =
    signupStrategy === ProgramItemSignupStrategy.DIRECT || signupAlwaysOpen;

  const isSignupOver = getTimeNow().isAfter(programItem.startTime);

  const hasSignedUp = isAlreadyDirectySigned(programItem, directSignups);

  return (
    <div>
      <SignupHelpText
        programItem={programItem}
        isSignupAlwaysOpen={signupAlwaysOpen}
        usesKonstiSignup={usesKonstiSignup}
        startTime={startTime}
        isInGroup={isInGroup}
      />

      {isNormalSignup &&
        !isSignupOver &&
        (!isDirectSignupMode ? (
          <LotterySignupProgramItem
            programItem={programItem}
            startTime={startTime}
            lotterySignups={lotterySignups}
            directSignups={directSignups}
          />
        ) : (
          <DirectSignupProgramItem
            programItem={programItem}
            programItemIsFull={attendees >= programItem.maxAttendance}
            startTime={startTime}
            loading={loading}
            setLoading={setLoading}
          />
        ))}

      {isSignupOver && hasSignedUp && (
        <LinkContainer>
          <AdmissionTicketLink programItemId={programItem.programItemId} />
        </LinkContainer>
      )}
    </div>
  );
};

const LinkContainer = styled.div`
  display: flex;
  justify-content: center;
`;
