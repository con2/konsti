import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { sortBy } from "lodash-es";
import { getStartTimes } from "client/utils/getStartTimes";
import { LotterySignupsByStartTimes } from "./LotterySignupsByStartTimes";
import { RaisedCard } from "client/components/RaisedCard";
import { useAppSelector } from "client/utils/hooks";
import {
  MyProgramHeader,
  MyProgramSecondaryText,
} from "client/views/my-program-items/components/shared";
import { selectGroupMembers } from "client/views/group/groupSlice";
import { LotterySignupWithProgramItem } from "client/views/my-program-items/myProgramItemsSlice";

interface Props {
  lotterySignups: readonly LotterySignupWithProgramItem[];
  isGroupCreator: boolean;
  isGroupMember: boolean;
}

export const MyLotterySignupsList = ({
  lotterySignups,
  isGroupCreator,
  isGroupMember,
}: Props): ReactElement => {
  const { t } = useTranslation();

  const groupMembers = useAppSelector(selectGroupMembers);

  const sortedLotterySignups = sortBy(lotterySignups, [
    (lotterySignup) => lotterySignup.programItem.startTime,
    (lotterySignup) => lotterySignup.priority,
  ]);

  const startTimes = getStartTimes(
    lotterySignups.map((lotterySignup) => lotterySignup.programItem),
  );

  return (
    <RaisedCard data-testid="lottery-signup-program-items-list">
      <MyProgramHeader>{t("lotterySignups")}</MyProgramHeader>

      {!isGroupCreator && isGroupMember && <p>{t("group.inGroupSignups")}</p>}

      {isGroupCreator && groupMembers.length > 0 && (
        <p>{t("group.groupCreatorSignups")}</p>
      )}

      {lotterySignups.length === 0 && (
        <MyProgramSecondaryText>{t("noLotterySignups")}</MyProgramSecondaryText>
      )}
      {lotterySignups.length > 0 && (
        <LotterySignupsByStartTimes
          lotterySignups={sortedLotterySignups}
          startTimes={startTimes}
        />
      )}
    </RaisedCard>
  );
};
