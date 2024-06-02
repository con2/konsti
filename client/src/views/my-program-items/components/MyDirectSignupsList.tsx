import { ReactElement, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { sortBy, uniq } from "lodash-es";
import styled from "styled-components";
import { DirectSignupsByStartTimes } from "./DirectSignupsByStartTimes";
import { getMissedSignups } from "client/views/my-program-items/utils/getMissedSignups";
import { Signup } from "shared/types/models/user";
import { config } from "shared/config";
import { RaisedCard } from "client/components/RaisedCard";

interface Props {
  directSignups: readonly Signup[];
  lotterySignups: readonly Signup[];
}

export const MyDirectSignupsList = ({
  directSignups,
  lotterySignups,
}: Props): ReactElement => {
  const { t } = useTranslation();

  const [missedSignups, setMissedSignups] = useState<string[]>([]);
  const [startTimes, setStartTimes] = useState<string[]>([]);

  useEffect(() => {
    setMissedSignups(getMissedSignups(lotterySignups, directSignups));
  }, [lotterySignups, directSignups]);

  useEffect(() => {
    setStartTimes(
      directSignups
        .map((directSignup) => directSignup.programItem.startTime)
        .concat(missedSignups),
    );
  }, [missedSignups, directSignups]);

  return (
    <RaisedCard data-testid="direct-signup-program-items-list">
      <Header>{t("directSignups")}</Header>
      {(!config.shared().resultsVisible || startTimes.length === 0) && (
        <SecondaryText>{t("noDirectSignups")}</SecondaryText>
      )}

      {config.shared().resultsVisible && startTimes.length !== 0 && (
        <DirectSignupsByStartTimes
          directSignups={sortBy(directSignups, [
            (directSignup) => directSignup.time,
          ])}
          startTimes={uniq(startTimes).sort()}
          missedSignups={missedSignups}
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
