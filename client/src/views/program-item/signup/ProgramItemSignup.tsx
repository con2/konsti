import { ReactElement } from "react";
import styled from "styled-components";
import {
  ProgramItem,
  ProgramItemSignupStrategy,
} from "shared/types/models/programItem";
import { ProgramItemDirectSignup } from "client/views/program-item/signup/components/direct-signup/ProgramItemDirectSignup";
import { ProgramItemLotterySignup } from "client/views/program-item/signup/components/lottery-signup/ProgramItemLotterySignup";
import { SignupHelpText } from "client/views/program-item/signup/components/SignupHelpText";
import { isAlreadyDirectySigned } from "client/views/program-item/programItemUtils";
import { AdmissionTicketLink } from "client/views/program-item/signup/components/AdmissionTicketLink";
import { isDirectSignupAlwaysOpen } from "shared/utils/isDirectSignupAlwaysOpen";
import {
  DirectSignupWithProgramItem,
  LotterySignupWithProgramItem,
} from "client/views/my-program-items/myProgramItemsSlice";
import { ProgramItemButtonGroup } from "client/views/program-item/components/ProgramItemButtonGroup";
import { programItemCardEndMargin } from "client/views/my-program-items/components/shared";

interface Props {
  signupStrategy: ProgramItemSignupStrategy;
  lotterySignups: readonly LotterySignupWithProgramItem[];
  directSignups: readonly DirectSignupWithProgramItem[];
  programItem: ProgramItem;
  attendees: number;
  usesKonstiSignup: boolean;
  signupRequired: boolean;
  isDirectSignupOver: boolean;
}

export const ProgramItemSignup = ({
  signupStrategy,
  lotterySignups,
  directSignups,
  programItem,
  attendees,
  usesKonstiSignup,
  signupRequired,
  isDirectSignupOver,
}: Props): ReactElement | null => {
  const signupAlwaysOpen = isDirectSignupAlwaysOpen(programItem);

  const isDirectSignupMode =
    signupStrategy === ProgramItemSignupStrategy.DIRECT || signupAlwaysOpen;

  const hasSignedUp = isAlreadyDirectySigned(programItem, directSignups);

  // After direct signup has ended, only signed-up users have content to show
  // (the admission ticket link). Render nothing rather than an empty element
  if (isDirectSignupOver && !hasSignedUp) {
    return null;
  }

  return (
    <Container>
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
        <ProgramItemButtonGroup>
          <AdmissionTicketLink programItemId={programItem.programItemId} />
        </ProgramItemButtonGroup>
      )}
    </Container>
  );
};

// Paragraphs keep their default 16px top margin (the gap between card
// content), but their bottom margin is the card-end standard; between content
// the following element's larger top margin wins the margin collapse, so this
// only shows at the end of the card
const Container = styled.div`
  p {
    margin-bottom: ${programItemCardEndMargin};
  }
`;
