import React, { ReactElement, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "react-redux";
import styled from "styled-components";
import { GroupMembersList } from "client/views/group/components/GroupMembersList";
import { loadGroupMembers } from "client/utils/loadData";
import { useAppSelector } from "client/utils/hooks";
import { getIsGroupCreator } from "client/views/group/groupUtils";
import { NotInGroupActions } from "client/views/group/components/NotInGroupActions";
import { GroupCreatorActions } from "client/views/group/components/GroupCreatorActions";
import { GroupMemberActions } from "client/views/group/components/GroupMemberActions";

export const GroupView = (): ReactElement => {
  const username = useAppSelector((state) => state.login.username);
  const serial = useAppSelector((state) => state.login.serial);
  const groupCode = useAppSelector((state) => state.group.groupCode);
  const groupMembers = useAppSelector((state) => state.group.groupMembers);
  const { t } = useTranslation();

  const [loading, setLoading] = useState<boolean>(false);
  const [showCreateGroup, setShowCreateGroup] = useState<boolean>(false);
  const [showJoinGroup, setShowJoinGroup] = useState<boolean>(false);

  const store = useStore();

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      await loadGroupMembers();
    };
    fetchData();
  }, [store]);

  const isInGroup = (): boolean => {
    if (groupCode && groupCode !== "0") {
      return true;
    }
    return false;
  };

  const isGroupCreator = getIsGroupCreator(groupCode, serial);
  const inGroup = isInGroup();

  return (
    <div className="group-view">
      <h2>{t("pages.group")}</h2>
      <p>{t("group.groupSignupGuide")}</p>

      {isGroupCreator && inGroup && (
        <p>
          <InfoTextSpan>{t("group.youAreGroupCreator")}</InfoTextSpan>.{" "}
          {t("group.groupCreatorInfo")}
        </p>
      )}

      {!isGroupCreator && inGroup && (
        <p>
          <InfoTextSpan>{t("group.youAreInGroup")}</InfoTextSpan>.{" "}
          {t("group.groupMemberInfo")}
        </p>
      )}

      {groupCode === "0" && !inGroup && (
        <NotInGroupActions
          showCreateGroup={showCreateGroup}
          showJoinGroup={showJoinGroup}
          setShowCreateGroup={setShowCreateGroup}
          setShowJoinGroup={setShowJoinGroup}
          username={username}
          serial={serial}
          loading={loading}
        />
      )}

      {inGroup && (
        <>
          {!isGroupCreator && (
            <GroupMemberActions
              username={username}
              groupCode={groupCode}
              serial={serial}
              setLoading={setLoading}
              setShowJoinGroup={setShowJoinGroup}
              loading={loading}
            />
          )}

          {isGroupCreator && (
            <GroupCreatorActions
              username={username}
              groupCode={groupCode}
              serial={serial}
              loading={loading}
              setLoading={setLoading}
              setShowCreateGroup={setShowCreateGroup}
            />
          )}

          <h3>{t("group.groupMembers")}</h3>
          <GroupMembersList groupMembers={groupMembers} />
        </>
      )}
    </div>
  );
};

const InfoTextSpan = styled.span`
  font-weight: 600;
`;
