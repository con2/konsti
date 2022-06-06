import React, { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import _ from "lodash";
import styled from "styled-components";
import { getStartTimes } from "client/utils/getStartTimes";
import { SignupsByStartTimes } from "./SignupsByStartTimes";
import { SelectedGame } from "shared/typings/models/user";

interface Props {
  signedGames: readonly SelectedGame[];
  isGroupCreator: boolean;
}

export const MySignupsList = ({
  signedGames,
  isGroupCreator,
}: Props): ReactElement => {
  const { t } = useTranslation();

  const sortedSignups = _.sortBy(signedGames, [
    (signedGame) => signedGame.gameDetails.startTime,
    (signedGame) => signedGame.priority,
  ]);

  const startTimes = getStartTimes(
    signedGames.map((signedGame) => signedGame.gameDetails)
  );

  return (
    <div>
      <h3>{t("signedGames")}</h3>

      {!isGroupCreator && <InfoText>{t("group.inGroupSignups")}</InfoText>}

      <MySignupsGames>
        {signedGames.length === 0 && <span>{t("noSignedGames")}</span>}
        {signedGames.length !== 0 && (
          <SignupsByStartTimes
            signups={sortedSignups}
            startTimes={startTimes}
          />
        )}
      </MySignupsGames>
    </div>
  );
};

const MySignupsGames = styled.div`
  padding-left: 30px;
`;

const InfoText = styled.p`
  font-weight: 600;
`;
