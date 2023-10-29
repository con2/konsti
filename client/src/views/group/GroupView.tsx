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
import { config } from "shared/config";

const { directSignupAlwaysOpenIds } = config.shared();

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
      (enteredGame) =>
        !directSignupAlwaysOpenIds.includes(enteredGame.gameDetails.gameId),
    )
    .filter((enteredGame) =>
      config
        .shared()
        .twoPhaseSignupProgramTypes.includes(
          enteredGame.gameDetails.programType,
        ),
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
      {/* <p>{t("group.groupLotterySignupTabletopOnly")}</p*/}

      {!isInGroup && (
        <>
          {hasEnteredGames && (
            <EnteredGamesContainer>
              <p>
                <BoldText>{t("group.hasEnteredFollowingGames")}</BoldText>
              </p>
              <ListItem>
                {filteredActiveEnteredGames.map((game) => (
                  <li key={game.gameDetails.gameId}>
                    <Link to={`/games/${game.gameDetails.gameId}`}>
                      {game.gameDetails.title}
                    </Link>
                  </li>
                ))}
              </ListItem>
              <p>
                <BoldText>
                  {t("group.cancelSignupBeforeJoiningOrCreatingGroup")}
                </BoldText>
              </p>
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
              <p>
                {t("group.groupCodeInfo")}
                <BoldText>{groupCode}</BoldText>.
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

const ListItem = styled.ul`
  padding: 0 0 0 20px;
`;
