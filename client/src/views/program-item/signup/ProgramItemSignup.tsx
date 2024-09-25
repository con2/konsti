import { ReactElement } from "react";
import styled from "styled-components";
import { ProgramItem } from "shared/types/models/programItem";
import { DirectSignupProgramItem } from "client/views/program-item/signup/components/DirectSignupProgramItem";
import { LotterySignupProgramItem } from "client/views/program-item/signup/components/LotterySignupProgramItem";
import { config } from "shared/config";
import { ProgramItemSignupStrategy } from "shared/types/models/programItem";
import { Signup } from "shared/types/models/user";
import { SignupHelpText } from "client/views/program-item/signup/components/SignupHelpText";
import { getTimeNow } from "client/utils/getTimeNow";
import { isAlreadyDirectySigned } from "client/views/program-item/programItemUtils";
import { AdmissionTicketLink } from "client/views/program-item/signup/components/AdmissionTicketLink";
import { getDirectSignupEndTime } from "shared/utils/signupTimes";

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

export const ProgramItemSignup = ({
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

  const directSignupEndTime = getDirectSignupEndTime(programItem);
  const isDirectSignupOver = getTimeNow().isAfter(directSignupEndTime);

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
        !isDirectSignupOver &&
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

      {isDirectSignupOver && hasSignedUp && (
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