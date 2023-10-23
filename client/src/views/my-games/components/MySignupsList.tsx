import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import _ from "lodash";
import styled from "styled-components";
import { getStartTimes } from "client/utils/getStartTimes";
import { SignupsByStartTimes } from "./SignupsByStartTimes";
import { SelectedGame } from "shared/typings/models/user";
import { RaisedCard } from "client/components/RaisedCard";
import { useAppSelector } from "client/utils/hooks";

interface Props {
  signedGames: readonly SelectedGame[];
  isGroupCreator: boolean;
  isGroupMember: boolean;
}

export const MySignupsList = ({
  signedGames,
  isGroupCreator,
  isGroupMember,
}: Props): ReactElement => {
  const { t } = useTranslation();

  const groupMembers = useAppSelector((state) => state.group.groupMembers);

  const sortedSignups = _.sortBy(signedGames, [
    (signedGame) => signedGame.gameDetails.startTime,
    (signedGame) => signedGame.priority,
  ]);

  const startTimes = getStartTimes(
    signedGames.map((signedGame) => signedGame.gameDetails),
  );

  return (
    <RaisedCard>
      <Header>{t("lotterySignedGames")}</Header>

      {!isGroupCreator && isGroupMember && (
        <InfoText>{t("group.inGroupSignups")}</InfoText>
      )}
      {isGroupCreator && groupMembers.length > 0 && (
        <InfoText>{t("group.groupCreatorSignups")}</InfoText>
      )}

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
