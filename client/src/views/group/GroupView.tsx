import React, { ReactElement, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "react-redux";
import styled from "styled-components";
import dayjs from "dayjs";
import { GroupMembersList } from "client/views/group/components/GroupMembersList";
import { loadGroupMembers } from "client/utils/loadData";
import { useAppSelector } from "client/utils/hooks";
import { getIsGroupCreator, getIsInGroup } from "client/views/group/groupUtils";
import { NotInGroupActions } from "client/views/group/components/NotInGroupActions";
import { GroupCreatorActions } from "client/views/group/components/GroupCreatorActions";
import { GroupMemberActions } from "client/views/group/components/GroupMemberActions";
import { ProgramType } from "shared/typings/models/game";
import { getTime } from "client/utils/getTime";
import { selectActiveEnteredGames } from "client/views/my-games/myGamesSlice";

export const GroupView = (): ReactElement => {
  const username = useAppSelector((state) => state.login.username);
  const serial = useAppSelector((state) => state.login.serial);
  const groupCode = useAppSelector((state) => state.group.groupCode);
  const groupMembers = useAppSelector((state) => state.group.groupMembers);
  const activeProgramType = useAppSelector(
    (state) => state.admin.activeProgramType
  );
  const activeEnteredGames = useAppSelector(selectActiveEnteredGames);
  const { t } = useTranslation();

  const store = useStore();

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      await loadGroupMembers();
    };
    fetchData();
  }, [store]);

  const isGroupCreator = getIsGroupCreator(groupCode, serial);
  const isInGroup = getIsInGroup(groupCode);
  const timeNow = getTime();
  const enteredGamesAfterNow = activeEnteredGames.filter((game) =>
    timeNow.isBefore(dayjs(game.time))
  );
  const hasEnteredGames = enteredGamesAfterNow.length > 0;

  return (
    <div className="group-view">
      <h2>{t("pages.group")}</h2>
      <p>{t("group.groupPreSignupGuide")}</p>

      {activeProgramType !== ProgramType.TABLETOP_RPG ? (
        <p>{t("group.groupPreSignupTabletopOnly")}</p>
      ) : (
        <>
          <p>
            {t("group.groupSignupGuide")} <BoldText>{serial}</BoldText>.
          </p>

          {!isInGroup && (
            <>
              {hasEnteredGames && (
                <EnteredGamesContainer>
                  <BoldText>{t("group.hasEnteredFollowingGames")}</BoldText>
                  <ul>
                    {activeEnteredGames.map((game) => (
                      <li key={game.gameDetails.gameId}>
                        {game.gameDetails.title}
                      </li>
                    ))}
                  </ul>
                  <BoldText>
                    {t("group.cancelSignupBeforeJoiningGroup")}
                  </BoldText>
                </EnteredGamesContainer>
              )}

              <NotInGroupActions
                disabled={hasEnteredGames}
                username={username}
                serial={serial}
              />
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
                  <GroupCreatorActions
                    username={username}
                    groupCode={groupCode}
                  />
                </>
              )}

              {!isGroupCreator && (
                <>
                  <p>
                    <BoldText>{t("group.youAreInGroup")}</BoldText>.{" "}
                    {t("group.groupMemberInfo")}
                  </p>
                  <GroupMemberActions username={username} />
                </>
              )}

              <h3>{t("group.groupMembers")}</h3>
              <GroupMembersList groupMembers={groupMembers} />
            </>
          )}
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
