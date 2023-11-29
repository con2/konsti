import { ReactElement, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import _ from "lodash";
import styled from "styled-components";
import { ResultsByStartTimes } from "./ResultsByStartTimes";
import { getMissedSignups } from "client/views/my-games/utils/getMissedSignups";
import { SelectedGame } from "shared/types/models/user";
import { config } from "shared/config";
import { RaisedCard } from "client/components/RaisedCard";

interface Props {
  enteredGames: readonly SelectedGame[];
  signedGames: readonly SelectedGame[];
}

export const MyEnteredList = ({
  enteredGames,
  signedGames,
}: Props): ReactElement => {
  const { t } = useTranslation();

  const [missedSignups, setMissedSignups] = useState<string[]>([]);
  const [startTimes, setStartTimes] = useState<string[]>([]);

  useEffect(() => {
    setMissedSignups(getMissedSignups(signedGames, enteredGames));
  }, [signedGames, enteredGames]);

  useEffect(() => {
    setStartTimes(
      enteredGames
        .map((enteredGame) => enteredGame.gameDetails.startTime)
        .concat(missedSignups),
    );
  }, [missedSignups, enteredGames]);

  return (
    <RaisedCard>
      <Header>{t("enteredGames")}</Header>
      {(!config.shared().resultsVisible || startTimes.length === 0) && (
        <SecondaryText>{t("noEnteredGames")}</SecondaryText>
      )}

      {config.shared().resultsVisible && startTimes.length !== 0 && (
        <ResultsByStartTimes
          signups={_.sortBy(enteredGames, [(enteredGame) => enteredGame.time])}
          startTimes={_.uniq(startTimes).sort()}
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
