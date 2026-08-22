import { isBefore } from "date-fns";
import { ReactElement, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import styled from "styled-components";
import { config } from "shared/config";
import { isLotterySignupProgramItem } from "shared/utils/isLotterySignupProgramItem";
import { AppRoute } from "client/app/routes";
import { useAppSelector } from "client/utils/hooks";
import { joinWithConjunction } from "client/utils/joinWithConjunction";
import { loadGroupMembers } from "client/utils/loadData";
import { useTimeFormatters } from "client/utils/useTimeFormatters";
import { useTimeNow } from "client/utils/useTimeNow";
import { GroupCreatorActions } from "client/views/group/components/GroupCreatorActions";
import { GroupMemberActions } from "client/views/group/components/GroupMemberActions";
import { GroupMembersList } from "client/views/group/components/GroupMembersList";
import { NotInGroupActions } from "client/views/group/components/NotInGroupActions";
import { selectGroupMembers } from "client/views/group/groupSlice";
import { getIsInGroup } from "client/views/group/groupUtils";
import { selectDirectSignups } from "client/views/my-program-items/myProgramItemsSlice";

export const GroupView = (): ReactElement => {
  const { twoPhaseSignupProgramTypes } = config.event();

  const username = useAppSelector((state) => state.login.username);
  const groupCode = useAppSelector((state) => state.group.groupCode);
  const isGroupCreator = useAppSelector((state) => state.group.isGroupCreator);
  const groupMembers = useAppSelector(selectGroupMembers);

  const directSignups = useAppSelector(selectDirectSignups);
  const { t } = useTranslation();
  const { getWeekdayAndTime } = useTimeFormatters();

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
  const timeNow = useTimeNow();
  const directSignupsAfterNow = filteredActiveDirectSignups.filter(
    (directSignup) =>
      isBefore(timeNow, new Date(directSignup.programItem.startTime)),
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
                {t("group.groupCodeInfo")}{" "}
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
