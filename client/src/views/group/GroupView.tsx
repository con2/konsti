import React, { ReactElement, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "react-redux";
import styled from "styled-components";
import { GroupMembersList } from "client/views/group/components/GroupMembersList";
import { loadGroupMembers } from "client/utils/loadData";
import { useAppSelector } from "client/utils/hooks";
import { getIsGroupCreator, getIsInGroup } from "client/views/group/groupUtils";
import { NotInGroupActions } from "client/views/group/components/NotInGroupActions";
import { GroupCreatorActions } from "client/views/group/components/GroupCreatorActions";
import { GroupMemberActions } from "client/views/group/components/GroupMemberActions";
import { ProgramType } from "shared/typings/models/game";

export const GroupView = (): ReactElement => {
  const { t } = useTranslation();

  const username = useAppSelector((state) => state.login.username);
  const serial = useAppSelector((state) => state.login.serial);
  const groupCode = useAppSelector((state) => state.group.groupCode);
  const groupMembers = useAppSelector((state) => state.group.groupMembers);
  const activeProgramType = useAppSelector(
    (state) => state.admin.activeProgramType
  );

  const store = useStore();

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      await loadGroupMembers();
    };
    fetchData();
  }, [store]);

  const isGroupCreator = getIsGroupCreator(groupCode, serial);
  const isInGroup = getIsInGroup(groupCode);

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
            <NotInGroupActions username={username} serial={serial} />
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

const BoldText = styled.span`
  font-weight: 600;
`;
