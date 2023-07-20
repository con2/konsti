import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import _ from "lodash";
import styled from "styled-components";
import { getStartTimes } from "client/utils/getStartTimes";
import { SignupsByStartTimes } from "./SignupsByStartTimes";
import { SelectedGame } from "shared/typings/models/user";
import { RaisedCard } from "client/components/RaisedCard";

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
    <RaisedCard>
      <Header>{t("lotterySignedGames")}</Header>

      {!isGroupCreator && <InfoText>{t("group.inGroupSignups")}</InfoText>}

      {signedGames.length === 0 && (
        <SecondaryText>{t("noSignedGames")}</SecondaryText>
      )}
      {signedGames.length !== 0 && (
        <SignupsByStartTimes signups={sortedSignups} startTimes={startTimes} />
      )}
    </RaisedCard>
  );
};

const InfoText = styled.p`
  font-weight: 600;
`;

const Header = styled.h3`
  margin: 0 0 12px 0;
`;

const SecondaryText = styled.span`
  color: ${(props) => props.theme.textSecondary};
`;
