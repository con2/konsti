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
import { selectDirectSignups } from "client/views/my-program-items/myProgramItemsSlice";
import { config } from "shared/config";
import { AppRoute } from "client/app/AppRoutes";

export const GroupView = (): ReactElement => {
  const { directSignupAlwaysOpenIds, twoPhaseSignupProgramTypes } =
    config.shared();

  const username = useAppSelector((state) => state.login.username);
  const groupCode = useAppSelector((state) => state.group.groupCode);
  const isGroupCreator = useAppSelector((state) => state.group.isGroupCreator);
  const groupMembers = useAppSelector((state) => state.group.groupMembers);

  const directSignups = useAppSelector(selectDirectSignups);
  const { t } = useTranslation();

  const store = useStore();

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      await loadGroupMembers();
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchData();
  }, [store]);

  const filteredActiveDirectSignups = directSignups
    .filter(
      (directSignup) =>
        !directSignupAlwaysOpenIds.includes(
          directSignup.programItem.programItemId,
        ),
    )
    .filter((directSignup) =>
      twoPhaseSignupProgramTypes.includes(directSignup.programItem.programType),
    );

  const isInGroup = getIsInGroup(groupCode);
  const timeNow = getTimeNow();
  const directSignupsAfterNow = filteredActiveDirectSignups.filter(
    (programItem) => timeNow.isSameOrBefore(dayjs(programItem.time)),
  );
  const hasDirectSignups = directSignupsAfterNow.length > 0;

  return (
    <div className="group-view">
      <p>
        {t("group.groupLotterySignupGuide")}{" "}
        {t("group.groupLotterySignupProgramTypes")}{" "}
        {twoPhaseSignupProgramTypes
          .map((twoPhaseSignupProgramType) =>
            t(`programTypePlural.${twoPhaseSignupProgramType}`),
          )
          .join(", ")}
        .
      </p>

      {!isInGroup && (
        <>
          {hasDirectSignups && (
            <DirectSignupsContainer>
              <p>{t("group.hasDirectlySignedFollowingProgramItems")}</p>
              <ListItem>
                {filteredActiveDirectSignups.map((programItem) => (
                  <li key={programItem.programItem.programItemId}>
                    <Link
                      to={`${AppRoute.PROGRAM_ITEM}/${programItem.programItem.programItemId}`}
                    >
                      {programItem.programItem.title}
                    </Link>
                  </li>
                ))}
              </ListItem>
              <p>{t("group.cancelSignupBeforeJoiningOrCreatingGroup")}</p>
            </DirectSignupsContainer>
          )}

          <NotInGroupActions disabled={hasDirectSignups} />
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
