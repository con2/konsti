import { ReactElement, useState } from "react";
import { useTranslation } from "react-i18next";
import { sortBy, groupBy } from "lodash-es";
import styled from "styled-components";
import { ProgramItemEntry } from "./ProgramItemEntry";
import { useAppSelector } from "client/utils/hooks";
import { ProgramItem } from "shared/types/models/programItem";
import { ProgramItemListTitle } from "client/views/all-program-items/components/ProgramItemListTitle";
import { getLotterySignups } from "client/utils/getUpcomingProgramItems";
import { getTimeslotSignupStrategy } from "client/views/all-program-items/allProgramItemsUtils";
import {
  selectDirectSignups,
  selectFavoriteProgramItems,
  selectLotterySignups,
} from "client/views/my-program-items/myProgramItemsSlice";
import { RaisedCard } from "client/components/RaisedCard";
import { getIsInGroup } from "client/views/group/groupUtils";

interface Props {
  programItems: readonly ProgramItem[];
}

export const AllProgramItemsList = ({ programItems }: Props): ReactElement => {
  const { t } = useTranslation();

  const signups = useAppSelector(
    (state) => state.allProgramItems.directSignups,
  );
  const lotterySignups = useAppSelector(selectLotterySignups);
  const directSignups = useAppSelector(selectDirectSignups);
  const activeProgramType = useAppSelector(
    (state) => state.admin.activeProgramType,
  );
  const groupMembers = useAppSelector((state) => state.group.groupMembers);
  const isGroupCreator = useAppSelector((state) => state.group.isGroupCreator);
  const groupCode = useAppSelector((state) => state.group.groupCode);
  const username = useAppSelector((state) => state.login.username);
  const loggedIn = useAppSelector((state) => state.login.loggedIn);
  const userGroup = useAppSelector((state) => state.login.userGroup);
  const favoriteProgramItems = useAppSelector(selectFavoriteProgramItems);
  const isInGroup = getIsInGroup(groupCode);

  const [loading, setLoading] = useState(false);

  const ownOrGroupCreatorLotterySignups = getLotterySignups({
    lotterySignups,
    isGroupCreator,
    groupMembers,
    isInGroup,
    getAllProgramItems: true,
  });

  const sortedProgramItems = sortBy(programItems, [
    (programItem) => programItem.startTime,
    (programItem) => programItem.title.toLowerCase(),
  ]);

  const programItemsByStartTime = groupBy(sortedProgramItems, "startTime");

  const programItemsList = Object.entries(programItemsByStartTime).map(
    ([startTime, programItemsForStartTime]) => {
      const timeslotSignupStrategy = getTimeslotSignupStrategy(
        programItemsForStartTime,
      );

      return (
        <div key={startTime}>
          <ProgramItemListTitle
            startTime={startTime}
            lotterySignups={ownOrGroupCreatorLotterySignups}
            directSignups={directSignups}
            timeslotSignupStrategy={timeslotSignupStrategy}
            isGroupCreator={isGroupCreator}
            groupCode={groupCode}
          />

          {programItemsForStartTime.map((programItem) => {
            const programItemSignups = signups.find(
              (programItemSignup) =>
                programItemSignup.programItemId === programItem.programItemId,
            );

            return (
              <ProgramItemEntry
                key={programItem.programItemId}
                isAlwaysExpanded={false}
                programItem={programItem}
                startTime={startTime}
                signups={programItemSignups?.users ?? []}
                signupStrategy={timeslotSignupStrategy}
                lotterySignups={ownOrGroupCreatorLotterySignups}
                directSignups={directSignups}
                loading={loading}
                setLoading={setLoading}
                username={username}
                loggedIn={loggedIn}
                userGroup={userGroup}
                favoriteProgramItems={favoriteProgramItems}
              />
            );
          })}
        </div>
      );
    },
  );

  return (
    <div>
      {programItems.length === 0 && (
        <RaisedCard>
          <NoProgramItemsText>
            {t("noProgramItemsAvailable", {
              PROGRAM_TYPE: t(
                `programTypePartitivePlural.${activeProgramType}`,
              ),
            })}
          </NoProgramItemsText>
        </RaisedCard>
      )}
      {programItems.length !== 0 && programItemsList}
    </div>
  );
};

const NoProgramItemsText = styled.span`
  color: ${(props) => props.theme.textSecondary};
  font-size: ${(props) => props.theme.fontSizeLarge};
`;
