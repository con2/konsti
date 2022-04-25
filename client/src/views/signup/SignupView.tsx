import React, { ReactElement, useEffect, useState } from "react";
import { useStore } from "react-redux";
import { SignupList } from "client/views/signup/components/SignupList";
import { getOpenStartTimes } from "client/utils/getOpenStartTimes";
import { loadGroupMembers, loadUser } from "client/utils/loadData";
import { getIsGroupCreator } from "client/views/group/utils/getIsGroupCreator";
import { useAppSelector } from "client/utils/hooks";

export const SignupView = (): ReactElement => {
  const games = useAppSelector((state) => state.allGames.games);
  const hiddenGames = useAppSelector((state) => state.admin.hiddenGames);
  const testTime = useAppSelector((state) => state.testSettings.testTime);
  const serial = useAppSelector((state) => state.login.serial);
  const groupCode = useAppSelector((state) => state.group.groupCode);

  const [signupTimes, setSignupTimes] = useState<readonly string[]>([]);

  const store = useStore();

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      await loadUser();
      await loadGroupMembers();
    };
    fetchData();
  }, [store]);

  useEffect(() => {
    const visibleGames = games.filter((game) => {
      const hidden = hiddenGames.find(
        (hiddenGame) => game.gameId === hiddenGame.gameId
      );
      if (!hidden) return game;
    });

    setSignupTimes(getOpenStartTimes(visibleGames));
  }, [hiddenGames, games, testTime]);

  const isGroupCreator = getIsGroupCreator(groupCode, serial);

  return (
    <div>
      <SignupList
        games={games}
        signupTimes={signupTimes}
        isGroupCreator={isGroupCreator}
      />
    </div>
  );
};
