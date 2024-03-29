import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { GroupMember } from "shared/types/models/groups";

interface Props {
  groupMembers: readonly GroupMember[];
}

export const GroupMembersList = ({ groupMembers }: Props): ReactElement => {
  const { t } = useTranslation();

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!groupMembers) {
    return <GroupMembersListContainer />;
  }

  const membersList = groupMembers.map((member, index) => {
    const isGroupCreator = member.groupCreatorCode !== "0";
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
