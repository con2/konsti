import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { ProgramItem } from "shared/types/models/programItem";
import { DirectSignupForm } from "client/views/all-program-items/components/DirectSignupForm";
import { AlgorithmSignupForm } from "client/views/all-program-items/components/AlgorithmSignupForm";
import { config } from "shared/config";
import { SignupStrategy } from "shared/config/sharedConfigTypes";
import { isRevolvingDoorWorkshop } from "client/utils/isRevolvingDoorWorkshop";
import { Signup } from "shared/types/models/user";

interface Props {
  signupStrategy: SignupStrategy;
  startTime: string;
  lotterySignups: readonly Signup[];
  programItem: ProgramItem;
  players: number;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export const SignupInfo = ({
  signupStrategy,
  startTime,
  lotterySignups,
  programItem,
  players,
  loading,
  setLoading,
}: Props): ReactElement => {
  const { t } = useTranslation();

  const signupAlwaysOpen = config
    .shared()
    .directSignupAlwaysOpenIds.includes(programItem.programItemId);

  const isEnterGameMode =
    config.shared().manualSignupMode === SignupStrategy.DIRECT ||
    signupStrategy === SignupStrategy.DIRECT ||
    signupAlwaysOpen;

  const requiresSignup = !isRevolvingDoorWorkshop(programItem);
  const konstiSignup = !config
    .shared()
    .noKonstiSignupIds.includes(programItem.programItemId);
  const normalSignup = requiresSignup && konstiSignup;

  return (
    <div>
      {!isEnterGameMode && normalSignup && (
        <AlgorithmSignupForm
          programItem={programItem}
          startTime={startTime}
          lotterySignups={lotterySignups}
        />
      )}

      {isEnterGameMode && normalSignup && (
        <DirectSignupForm
          programItem={programItem}
          programItemIsFull={players >= programItem.maxAttendance}
          startTime={startTime}
          loading={loading}
          setLoading={setLoading}
        />
      )}

      {!requiresSignup && (
        <p>
          {t("signup.doesNotRequireSignup", {
            PROGRAM_TYPE: t(`programTypeIllative.${programItem.programType}`),
          })}
        </p>
      )}

      {!konstiSignup && (
        <p>
          {t("signup.noKonstiSignup", {
            PROGRAM_TYPE: t(`programTypeIllative.${programItem.programType}`),
          })}
        </p>
      )}
    </div>
  );
};
