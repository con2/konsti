import { ReactElement } from "react";
import styled from "styled-components";
import {
  ProgramItem,
  ProgramItemSignupStrategy,
} from "shared/types/models/programItem";
import { ProgramItemDirectSignup } from "client/views/program-item/signup/components/direct-signup/ProgramItemDirectSignup";
import { ProgramItemLotterySignup } from "client/views/program-item/signup/components/lottery-signup/ProgramItemLotterySignup";
import { SignupHelpText } from "client/views/program-item/signup/components/SignupHelpText";
import { getTimeNow } from "client/utils/getTimeNow";
import { isAlreadyDirectySigned } from "client/views/program-item/programItemUtils";
import { AdmissionTicketLink } from "client/views/program-item/signup/components/AdmissionTicketLink";
import { getDirectSignupEndTime } from "shared/utils/signupTimes";
import { isDirectSignupAlwaysOpen } from "shared/utils/isDirectSignupAlwaysOpen";
import {
  DirectSignupWithProgramItem,
  LotterySignupWithProgramItem,
} from "client/views/my-program-items/myProgramItemsSlice";

interface Props {
  signupStrategy: ProgramItemSignupStrategy;
  lotterySignups: readonly LotterySignupWithProgramItem[];
  directSignups: readonly DirectSignupWithProgramItem[];
  programItem: ProgramItem;
  attendees: number;
  usesKonstiSignup: boolean;
  signupRequired: boolean;
}

export const ProgramItemSignup = ({
  signupStrategy,
  lotterySignups,
  directSignups,
  programItem,
  attendees,
  usesKonstiSignup,
  signupRequired,
}: Props): ReactElement => {
  const signupAlwaysOpen = isDirectSignupAlwaysOpen(programItem);

  const isDirectSignupMode =
    signupStrategy === ProgramItemSignupStrategy.DIRECT || signupAlwaysOpen;

  const directSignupEndTime = getDirectSignupEndTime(programItem);
  const isDirectSignupOver = getTimeNow().isAfter(directSignupEndTime);

  const hasSignedUp = isAlreadyDirectySigned(programItem, directSignups);

  return (
    <div>
      <SignupHelpText
        programItem={programItem}
        usesKonstiSignup={usesKonstiSignup}
      />

      {signupRequired &&
        !isDirectSignupOver &&
        (isDirectSignupMode ? (
          <ProgramItemDirectSignup
            programItem={programItem}
            programItemIsFull={attendees >= programItem.maxAttendance}
          />
        ) : (
          <ProgramItemLotterySignup
            programItem={programItem}
            lotterySignups={lotterySignups}
            directSignups={directSignups}
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
