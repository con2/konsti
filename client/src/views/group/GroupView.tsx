import { ReactElement, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "react-redux";
import styled from "styled-components";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import { GroupMembersList } from "client/views/group/components/GroupMembersList";
import { loadGroupMembers } from "client/utils/loadData";
import { useAppSelector } from "client/utils/hooks";
import { getIsInGroup } from "client/views/group/groupUtils";
import { NotInGroupActions } from "client/views/group/components/NotInGroupActions";
import { GroupCreatorActions } from "client/views/group/components/GroupCreatorActions";
import { GroupMemberActions } from "client/views/group/components/GroupMemberActions";
import { getTimeNow } from "client/utils/getTimeNow";
import { selectEnteredGames } from "client/views/my-games/myGamesSlice";
import { sharedConfig } from "shared/config/sharedConfig";
import { ProgramType } from "shared/typings/models/game";

const { directSignupAlwaysOpenIds } = sharedConfig;

export const GroupView = (): ReactElement => {
  const username = useAppSelector((state) => state.login.username);
  const groupCode = useAppSelector((state) => state.group.groupCode);
  const isGroupCreator = useAppSelector((state) => state.group.isGroupCreator);
  const groupMembers = useAppSelector((state) => state.group.groupMembers);

  const enteredGames = useAppSelector(selectEnteredGames);
  const { t } = useTranslation();

  const store = useStore();

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      await loadGroupMembers();
    };
    fetchData();
  }, [store]);

  const filteredActiveEnteredGames = enteredGames
    .filter(
      (activeEnteredGame) =>
        !directSignupAlwaysOpenIds.includes(
          activeEnteredGame.gameDetails.gameId,
        ),
    )
    .filter(
      (game) => game.gameDetails.programType === ProgramType.TABLETOP_RPG,
    );

  const isInGroup = getIsInGroup(groupCode);
  const timeNow = getTimeNow();
  const enteredGamesAfterNow = filteredActiveEnteredGames.filter((game) =>
    timeNow.isBefore(dayjs(game.time)),
  );
  const hasEnteredGames = enteredGamesAfterNow.length > 0;

  return (
    <div className="group-view">
      <p>{t("group.groupLotterySignupGuide")}</p>
      <p>{t("group.groupLotterySignupTabletopOnly")}</p>

      {!isInGroup && (
        <>
          {hasEnteredGames && (
            <EnteredGamesContainer>
              <BoldText>{t("group.hasEnteredFollowingGames")}</BoldText>
              <ul>
                {filteredActiveEnteredGames.map((game) => (
                  <li key={game.gameDetails.gameId}>
                    <Link to={`/games/${game.gameDetails.gameId}`}>
                      {game.gameDetails.title}
                    </Link>
                  </li>
                ))}
              </ul>
              <BoldText>
                {t("group.cancelSignupBeforeJoiningOrCreatingGroup")}
              </BoldText>
            </EnteredGamesContainer>
          )}

          <NotInGroupActions disabled={hasEnteredGames} />
        </>
      )}

      {isInGroup && (
        <>
          {isGroupCreator && (
            <>
              <p>
                <BoldText>{t("group.youAreGroupCreator")}</BoldText>.{" "}
                {t("group.groupCreatorInfo")}
              </p>
              <GroupCreatorActions username={username} groupCode={groupCode} />
            </>
          )}

          {!isGroupCreator && (
            <>
              <p>
                <BoldText>{t("group.youAreInGroup")}</BoldText>.{" "}
                {t("group.groupMemberInfo")}
              </p>
              <GroupMemberActions />
            </>
          )}

          <h3>{t("group.groupMembers")}</h3>
          <GroupMembersList groupMembers={groupMembers} />
        </>
      )}
    </div>
  );
};

const EnteredGamesContainer = styled.div`
  margin: 10px 0;

  > ul {
    margin: 10px 15px;
  }
`;

const BoldText = styled.span`
  font-weight: 600;
`;
