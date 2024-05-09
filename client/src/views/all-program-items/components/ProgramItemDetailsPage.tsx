import { ReactElement, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { Loading } from "client/components/Loading";
import { useAppSelector } from "client/utils/hooks";
import { ProgramItemEntry } from "client/views/all-program-items/components/ProgramItemEntry";
import {
  selectDirectSignups,
  selectFavoritedGames,
  selectLotterySignups,
} from "client/views/my-program-items/myProgramItemsSlice";
import { SignupStrategy } from "shared/config/sharedConfigTypes";
import { getLotterySignups } from "client/utils/getUpcomingProgramItems";
import { BackButton } from "client/components/BackButton";
import { getIsInGroup } from "client/views/group/groupUtils";

export const ProgramItemDetailsPage = (): ReactElement => {
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
  const favoritedGames = useAppSelector(selectFavoritedGames);

  // Figure out if user has signed up to this game
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

  const foundGame = programItems.find(
    (programItem) => programItem.programItemId === programItemId,
  );
  const playerCount =
    signups.find(
      (gameSignup) => gameSignup.programItemId === foundGame?.programItemId,
    )?.users.length ?? 0;

  useEffect(() => {
    setLoading(false);
  }, [foundGame]);

  return (
    <div>
      <BackButton />
      {loading && <Loading />}
      {foundGame && (
        <ProgramItemEntry
          isAlwaysExpanded={true}
          programItem={foundGame}
          startTime={foundGame.startTime}
          players={playerCount}
          signupStrategy={foundGame.signupStrategy ?? SignupStrategy.DIRECT}
          lotterySignups={ownOrGroupCreatorLotterySignups}
          directSignups={directSignups}
          loading={loading}
          setLoading={setLoading}
          username={username}
          loggedIn={loggedIn}
          userGroup={userGroup}
          favoritedProgramItems={favoritedGames}
        />
      )}
      {!loading && !foundGame && (
        <div>
          {t("invalidProgramItemId")} {programItemId}.
        </div>
      )}
    </div>
  );
};
