import React, { ReactElement, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import _ from "lodash";
import styled from "styled-components";
import { ResultsByStartTimes } from "./ResultsByStartTimes";
import { getMissedSignups } from "client/views/my-games/utils/getMissedSignups";
import { SelectedGame } from "shared/typings/models/user";

export interface Props {
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
        .map((sortedEnteredGame) => {
          return sortedEnteredGame.time;
        })
        .concat(missedSignups)
    );
  }, [missedSignups]);

  return (
    <div>
      <h3>{t("enteredGames")}</h3>
      <MyEnteredGames>
        {startTimes.length === 0 && <span>{t("noEnteredGames")}</span>}
        {startTimes.length !== 0 && (
          <ResultsByStartTimes
            signups={_.sortBy(enteredGames, [
              (enteredGame) => enteredGame.time,
            ])}
            startTimes={[...Array.from(new Set(startTimes))].sort()}
            missedSignups={missedSignups}
          />
        )}
      </MyEnteredGames>
    </div>
  );
};

const MyEnteredGames = styled.div`
  padding-left: 30px;
`;
