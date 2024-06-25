import { ReactElement, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { Loading } from "client/components/Loading";
import { useAppSelector } from "client/utils/hooks";
import { ProgramItemEntry } from "client/views/all-program-items/components/ProgramItemEntry";
import {
  selectDirectSignups,
  selectFavoriteProgramItems,
  selectLotterySignups,
} from "client/views/my-program-items/myProgramItemsSlice";
import { SignupStrategy } from "shared/config/sharedConfigTypes";
import { getLotterySignups } from "client/utils/getUpcomingProgramItems";
import { BackButton } from "client/components/BackButton";
import { getIsInGroup } from "client/views/group/groupUtils";

export const ProgramItemPage = (): ReactElement => {
  const { t } = useTranslation();

  const { programItemId } = useParams();

  const programItems = useAppSelector(
    (state) => state.allProgramItems.programItems,
  );
  const signups = useAppSelector(
    (state) => state.allProgramItems.directSignups,
  );
  const directSignups = useAppSelector(selectDirectSignups);
  const username = useAppSelector((state) => state.login.username);
  const loggedIn = useAppSelector((state) => state.login.loggedIn);
  const userGroup = useAppSelector((state) => state.login.userGroup);
  const favoriteProgramItems = useAppSelector(selectFavoriteProgramItems);

  // Figure out if user has signed up to this program item
  const lotterySignups = useAppSelector(selectLotterySignups);
  const isGroupCreator = useAppSelector((state) => state.group.isGroupCreator);
  const groupMembers = useAppSelector((state) => state.group.groupMembers);
  const groupCode = useAppSelector((state) => state.group.groupCode);
  const isInGroup = getIsInGroup(groupCode);

  const ownOrGroupCreatorLotterySignups = getLotterySignups({
    lotterySignups,
    isGroupCreator,
    groupMembers,
    isInGroup,
    getAllProgramItems: true,
  });

  const [loading, setLoading] = useState<boolean>(true);

  const foundProgramItem = programItems.find(
    (programItem) => programItem.programItemId === programItemId,
  );
  const programSignups =
    signups.find(
      (programItemSignup) =>
        programItemSignup.programItemId === foundProgramItem?.programItemId,
    )?.users ?? [];

  const signupQuestions = useAppSelector(
    (state) => state.admin.signupQuestions,
  );

  const publicSignupQuestion = signupQuestions.find(
    (s) => s.programItemId === programItemId && !s.private,
  );

  useEffect(() => {
    setLoading(false);
  }, [foundProgramItem]);

  return (
    <div>
      <BackButton />
      {loading && <Loading />}
      {foundProgramItem && (
        <ProgramItemEntry
          isAlwaysExpanded={true}
          programItem={foundProgramItem}
          startTime={foundProgramItem.startTime}
          signups={programSignups}
          signupStrategy={
            foundProgramItem.signupStrategy ?? SignupStrategy.DIRECT
          }
          lotterySignups={ownOrGroupCreatorLotterySignups}
          directSignups={directSignups}
          loading={loading}
          setLoading={setLoading}
          username={username}
          loggedIn={loggedIn}
          userGroup={userGroup}
          favoriteProgramItems={favoriteProgramItems}
          publicSignupQuestion={publicSignupQuestion}
        />
      )}
      {!loading && !foundProgramItem && (
        <div>
          {t("invalidProgramItemId")} {programItemId}.
        </div>
      )}
    </div>
  );
};
