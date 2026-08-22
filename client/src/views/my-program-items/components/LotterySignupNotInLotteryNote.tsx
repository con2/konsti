import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { ProgramItem } from "shared/types/models/programItem";
import { getLotterySignupEndTime } from "shared/utils/signupTimes";
import { InfoText } from "client/components/InfoText";
import { InfoTextVariant } from "client/components/componentStyles";
import { useTimeNow } from "client/utils/useTimeNow";
import { DirectSignupWithProgramItem } from "client/views/my-program-items/myProgramItemsSlice";
import { getDirectSignupForSlot } from "client/views/program-item/programItemUtils";

interface Props {
  programItem: ProgramItem;
  directSignups: readonly DirectSignupWithProgramItem[];
  className?: string;
}

// A lottery sign-up the lottery will pass over, because the attendee already holds a spot at its
// start time. Only rendered while that lottery still has to run: once it has, the attendee's own
// placement is a spot at that time too, and the note would tell a winner to cancel what they won
export const LotterySignupNotInLotteryNote = ({
  programItem,
  directSignups,
  className,
}: Props): ReactElement | null => {
  const { t } = useTranslation();
  const timeNow = useTimeNow();

  const holdsSpotForSlot = Boolean(
    getDirectSignupForSlot(directSignups, programItem),
  );
  const lotteryStillToRun =
    timeNow.getTime() < getLotterySignupEndTime(programItem).getTime();

  if (!holdsSpotForSlot || !lotteryStillToRun) {
    return null;
  }

  return (
    <InfoText className={className} variant={InfoTextVariant.WARNING}>
      {t("signup.lotterySignupNotInLottery")}
    </InfoText>
  );
};
