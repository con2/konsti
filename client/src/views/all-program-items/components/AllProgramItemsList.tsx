import { ReactElement, useState } from "react";
import { useTranslation } from "react-i18next";
import { sortBy, groupBy } from "lodash-es";
import styled from "styled-components";
import { ProgramItemEntry } from "client/views/program-item/ProgramItemEntry";
import { useAppSelector } from "client/utils/hooks";
import {
  ProgramItem,
  ProgramItemSignupStrategy,
} from "shared/types/models/programItem";
import { ProgramItemListTitle } from "client/views/all-program-items/components/ProgramItemListTitle";
import { getLotterySignups } from "client/utils/getUpcomingProgramItems";
import {
  selectDirectSignups,
  selectFavoriteProgramItems,
  selectLotterySignups,
} from "client/views/my-program-items/myProgramItemsSlice";
import { RaisedCard } from "client/components/RaisedCard";
import { getIsInGroup } from "client/views/group/groupUtils";
import { SignupQuestion } from "shared/types/models/settings";

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

  const signupQuestions = useAppSelector(
    (state) => state.admin.signupQuestions,
  );

  const getPublicSignupQuestion = (
    programItemId: string,
  ): SignupQuestion | undefined =>
    signupQuestions.find(
      (s) => s.programItemId === programItemId && !s.private,
    );

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
      return (
        <div key={startTime}>
          <ProgramItemListTitle startTime={startTime} />

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
                signupStrategy={
                  programItem.signupStrategy ?? ProgramItemSignupStrategy.DIRECT
                }
                lotterySignups={ownOrGroupCreatorLotterySignups}
                directSignups={directSignups}
                loading={loading}
                setLoading={setLoading}
                username={username}
                loggedIn={loggedIn}
                userGroup={userGroup}
                favoriteProgramItems={favoriteProgramItems}
                publicSignupQuestion={getPublicSignupQuestion(
                  programItem.programItemId,
                )}
                isInGroup={isInGroup}
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
      {programItems.length > 0 && programItemsList}
    </div>
  );
};

const NoProgramItemsText = styled.span`
  color: ${(props) => props.theme.textSecondary};
  font-size: ${(props) => props.theme.fontSizeLarge};
`;
