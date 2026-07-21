import { ReactElement, useEffect } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import dayjs from "dayjs";
import { Link } from "react-router";
import { GroupMembersList } from "client/views/group/components/GroupMembersList";
import { loadGroupMembers } from "client/utils/loadData";
import { useAppSelector } from "client/utils/hooks";
import { getIsInGroup } from "client/views/group/groupUtils";
import { NotInGroupActions } from "client/views/group/components/NotInGroupActions";
import { GroupCreatorActions } from "client/views/group/components/GroupCreatorActions";
import { GroupMemberActions } from "client/views/group/components/GroupMemberActions";
import { getTimeNow } from "client/utils/getTimeNow";
import { selectDirectSignups } from "client/views/my-program-items/myProgramItemsSlice";
import { config } from "shared/config";
import { AppRoute } from "client/app/AppRoutes";
import { isLotterySignupProgramItem } from "shared/utils/isLotterySignupProgramItem";
import { selectGroupMembers } from "client/views/group/groupSlice";
import { getWeekdayAndTime } from "shared/utils/timeFormatter";
import { joinWithConjunction } from "client/utils/joinWithConjunction";

export const GroupView = (): ReactElement => {
  const { twoPhaseSignupProgramTypes } = config.event();

  const username = useAppSelector((state) => state.login.username);
  const groupCode = useAppSelector((state) => state.group.groupCode);
  const isGroupCreator = useAppSelector((state) => state.group.isGroupCreator);
  const groupMembers = useAppSelector(selectGroupMembers);

  const directSignups = useAppSelector(selectDirectSignups);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      await loadGroupMembers();
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchData();
  }, []);

  const filteredActiveDirectSignups = directSignups.filter((directSignup) =>
    isLotterySignupProgramItem(directSignup.programItem),
  );

  const isInGroup = getIsInGroup(groupCode);
  const timeNow = getTimeNow();
  const directSignupsAfterNow = filteredActiveDirectSignups.filter(
    (directSignup) =>
      timeNow.isBefore(dayjs(directSignup.programItem.startTime)),
  );
  const hasUpcomingDirectSignups = directSignupsAfterNow.length > 0;

  const lotteryProgramTypesList = joinWithConjunction(
    twoPhaseSignupProgramTypes.map((twoPhaseSignupProgramType) =>
      t(`programTypePlural.${twoPhaseSignupProgramType}`),
    ),
    t("and"),
  );

  return (
    <div className="group-view">
      <p>
        {t("group.groupLotterySignupGuide")}{" "}
        {t("group.groupLotterySignupProgramTypes")} {lotteryProgramTypesList}.
      </p>

      {!isInGroup && (
        <>
          {hasUpcomingDirectSignups && (
            <DirectSignupsContainer>
              <p>{t("group.hasDirectlySignedFollowingProgramItems")}</p>
              <ListItem data-testid="upcoming-direct-signups">
                {directSignupsAfterNow.map((directSignup) => (
                  <li key={directSignup.programItemId}>
                    <Link
                      to={`${AppRoute.PROGRAM_ITEM}/${directSignup.programItemId}`}
                    >
                      {directSignup.programItem.title}
                    </Link>{" "}
                    - {getWeekdayAndTime(directSignup.programItem.startTime)}
                  </li>
                ))}
              </ListItem>
              <p>{t("group.cancelSignupBeforeJoiningOrCreatingGroup")}</p>
            </DirectSignupsContainer>
          )}

          <NotInGroupActions disabled={hasUpcomingDirectSignups} />
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
                <BoldText data-testid="group-code">{groupCode}</BoldText>.
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

const DirectSignupsContainer = styled.div`
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
