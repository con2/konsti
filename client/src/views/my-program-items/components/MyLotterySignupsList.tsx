import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { sortBy } from "remeda";
import { LotterySignupsByStartTimes } from "./LotterySignupsByStartTimes";
import { RaisedCard } from "client/components/RaisedCard";
import { useAppSelector } from "client/utils/hooks";
import {
  EmptyContentContainer,
  MyProgramHeader,
  MyProgramSecondaryText,
  ShowAllButton,
} from "client/views/my-program-items/components/shared";
import { selectGroupMembers } from "client/views/group/groupSlice";
import { LotterySignupWithProgramItem } from "client/views/my-program-items/myProgramItemsSlice";

interface Props {
  lotterySignups: readonly LotterySignupWithProgramItem[];
  isGroupCreator: boolean;
  isGroupMember: boolean;
  showAllProgramItems: boolean;
  setShowAllProgramItems: (showAllProgramItems: boolean) => void;
}

export const MyLotterySignupsList = ({
  lotterySignups,
  isGroupCreator,
  isGroupMember,
  showAllProgramItems,
  setShowAllProgramItems,
}: Props): ReactElement => {
  const { t } = useTranslation();

  const groupMembers = useAppSelector(selectGroupMembers);

  const sortedLotterySignups = sortBy(
    lotterySignups,
    (lotterySignup) => lotterySignup.programItem.startTime,
    (lotterySignup) => lotterySignup.priority,
  );

  return (
    <RaisedCard data-testid="lottery-signup-program-items-list">
      <MyProgramHeader>{t("lotterySignups")}</MyProgramHeader>

      {!isGroupCreator && isGroupMember && <p>{t("group.inGroupSignups")}</p>}

      {isGroupCreator && groupMembers.length > 0 && (
        <p>{t("group.groupCreatorSignups")}</p>
      )}

      {lotterySignups.length === 0 && (
        <EmptyContentContainer>
          <MyProgramSecondaryText>
            {showAllProgramItems
              ? t("noLotterySignups")
              : t("noFutureLotterySignups")}
          </MyProgramSecondaryText>
          {!showAllProgramItems && (
            <ShowAllButton
              onClick={() => setShowAllProgramItems(!showAllProgramItems)}
            >
              {t("showAllProgramItems")}
            </ShowAllButton>
          )}
        </EmptyContentContainer>
      )}
      {lotterySignups.length > 0 && (
        <LotterySignupsByStartTimes lotterySignups={sortedLotterySignups} />
      )}
    </RaisedCard>
  );
};
