import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { GroupMember } from "shared/typings/models/groups";

interface Props {
  groupMembers: readonly GroupMember[];
}

export const GroupMembersList = ({ groupMembers }: Props): ReactElement => {
  const { t } = useTranslation();

  if (!groupMembers) {
    return <GroupMembersListContainer />;
  }

  const membersList = groupMembers.map((member, index) => {
    const isGroupCreator = member.serial === member.groupCode;
    return (
      <p key={member.username}>
        {index + 1}
        {")"} {member.username}{" "}
        {isGroupCreator && <span>({t("group.groupCreator")})</span>}
      </p>
    );
  });

  return <GroupMembersListContainer>{membersList}</GroupMembersListContainer>;
};

const GroupMembersListContainer = styled.div`
  margin: 0 0 0 14px;
`;
