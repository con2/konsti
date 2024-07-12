import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { sortBy } from "lodash-es";
import styled from "styled-components";
import { getStartTimes } from "client/utils/getStartTimes";
import { LotterySignupsByStartTimes } from "./LotterySignupsByStartTimes";
import { Signup } from "shared/types/models/user";
import { RaisedCard } from "client/components/RaisedCard";
import { useAppSelector } from "client/utils/hooks";

interface Props {
  lotterySignups: readonly Signup[];
  isGroupCreator: boolean;
  isGroupMember: boolean;
}

export const MyLotterySignupsList = ({
  lotterySignups,
  isGroupCreator,
  isGroupMember,
}: Props): ReactElement => {
  const { t } = useTranslation();

  const groupMembers = useAppSelector((state) => state.group.groupMembers);

  const sortedLotterySignups = sortBy(lotterySignups, [
    (lotterySignup) => lotterySignup.programItem.startTime,
    (lotterySignup) => lotterySignup.priority,
  ]);

  const startTimes = getStartTimes(
    lotterySignups.map((lotterySignup) => lotterySignup.programItem),
  );

  return (
    <RaisedCard data-testid="lottery-signup-program-items-list">
      <Header>{t("lotterySignups")}</Header>

      {!isGroupCreator && isGroupMember && <p>{t("group.inGroupSignups")}</p>}

      {isGroupCreator && groupMembers.length > 0 && (
        <p>{t("group.groupCreatorSignups")}</p>
      )}

      {lotterySignups.length === 0 && (
        <SecondaryText>{t("noLotterySignups")}</SecondaryText>
      )}
      {lotterySignups.length !== 0 && (
        <LotterySignupsByStartTimes
          lotterySignups={sortedLotterySignups}
          startTimes={startTimes}
        />
      )}
    </RaisedCard>
  );
};

const Header = styled.h3`
  margin: 0 0 12px 0;
`;

const SecondaryText = styled.span`
  color: ${(props) => props.theme.textSecondary};
`;
