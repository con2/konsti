import { ReactElement } from "react";
import { ProgramItem } from "shared/types/models/programItem";
import { DirectSignupProgramItem } from "client/views/all-program-items/components/DirectSignupProgramItem";
import { LotterySignupProgramItem } from "client/views/all-program-items/components/LotterySignupProgramItem";
import { config } from "shared/config";
import { SignupStrategy } from "shared/config/sharedConfigTypes";
import { isRevolvingDoorWorkshop } from "client/utils/isRevolvingDoorWorkshop";
import { Signup } from "shared/types/models/user";
import { SignupHelpText } from "client/views/all-program-items/components/SignupHelpText";
import { getTimeNow } from "client/utils/getTimeNow";

interface Props {
  signupStrategy: SignupStrategy;
  startTime: string;
  lotterySignups: readonly Signup[];
  directSignups: readonly Signup[];
  programItem: ProgramItem;
  attendees: number;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  isInGroup: boolean;
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
}: Props): ReactElement => {
  const signupAlwaysOpen = config
    .shared()
    .directSignupAlwaysOpenIds.includes(programItem.programItemId);

  const isDirectSignupMode =
    config.shared().manualSignupMode === SignupStrategy.DIRECT ||
    signupStrategy === SignupStrategy.DIRECT ||
    signupAlwaysOpen;

  const requiresSignup = !isRevolvingDoorWorkshop(programItem);
  const konstiSignup = !config
    .shared()
    .noKonstiSignupIds.includes(programItem.programItemId);
  const normalSignup = requiresSignup && konstiSignup;

  const isSignupOver = getTimeNow().isAfter(programItem.startTime);

  return (
    <div>
      <SignupHelpText
        programItem={programItem}
        isSignupAlwaysOpen={signupAlwaysOpen}
        usesKonstiSignup={konstiSignup}
        startTime={startTime}
        isInGroup={isInGroup}
      />

      {normalSignup &&
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
    </div>
  );
};
