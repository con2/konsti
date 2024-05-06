import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Game } from "shared/types/models/game";
import { DirectSignupForm } from "client/views/all-games/components/DirectSignupForm";
import { AlgorithmSignupForm } from "client/views/all-games/components/AlgorithmSignupForm";
import { config } from "shared/config";
import { SignupStrategy } from "shared/config/sharedConfigTypes";
import { isRevolvingDoorWorkshop } from "client/utils/isRevolvingDoorWorkshop";
import { Signup } from "shared/types/models/user";

interface Props {
  signupStrategy: SignupStrategy;
  startTime: string;
  lotterySignups: readonly Signup[];
  game: Game;
  players: number;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export const SignupInfo = ({
  signupStrategy,
  startTime,
  lotterySignups,
  game,
  players,
  loading,
  setLoading,
}: Props): ReactElement => {
  const { t } = useTranslation();

  const signupAlwaysOpen = config
    .shared()
    .directSignupAlwaysOpenIds.includes(game.gameId);

  const isEnterGameMode =
    config.shared().manualSignupMode === SignupStrategy.DIRECT ||
    signupStrategy === SignupStrategy.DIRECT ||
    signupAlwaysOpen;

  const requiresSignup = !isRevolvingDoorWorkshop(game);
  const konstiSignup = !config.shared().noKonstiSignupIds.includes(game.gameId);
  const normalSignup = requiresSignup && konstiSignup;

  return (
    <div>
      {!isEnterGameMode && normalSignup && (
        <AlgorithmSignupForm
          game={game}
          startTime={startTime}
          lotterySignups={lotterySignups}
        />
      )}

      {isEnterGameMode && normalSignup && (
        <DirectSignupForm
          game={game}
          gameIsFull={players >= game.maxAttendance}
          startTime={startTime}
          loading={loading}
          setLoading={setLoading}
        />
      )}

      {!requiresSignup && (
        <p>
          {t("signup.doesNotRequireSignup", {
            PROGRAM_TYPE: t(`programTypeIllative.${game.programType}`),
          })}
        </p>
      )}

      {!konstiSignup && (
        <p>
          {t("signup.noKonstiSignup", {
            PROGRAM_TYPE: t(`programTypeIllative.${game.programType}`),
          })}
        </p>
      )}
    </div>
  );
};
