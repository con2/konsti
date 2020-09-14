import React, { FC, ReactElement } from 'react';
import { useSelector, useStore } from 'react-redux';
import { SignupList } from 'views/signup/components/SignupList';
import { getOpenStartTimes } from 'utils/getOpenStartTimes';
import { loadGroupMembers, loadUser } from 'utils/loadData';
import { isGroupLeader } from 'views/group/GroupView';
import { Game } from 'typings/game.typings';
import { RootState } from 'typings/redux.typings';

export const SignupView: FC = (): ReactElement => {
  const games: readonly Game[] = useSelector(
    (state: RootState) => state.allGames.games
  );
  const hiddenGames: readonly Game[] = useSelector(
    (state: RootState) => state.admin.hiddenGames
  );
  const testTime: string = useSelector(
    (state: RootState) => state.admin.testTime
  );
  const serial: string = useSelector((state: RootState) => state.login.serial);
  const groupCode: string = useSelector(
    (state: RootState) => state.login.groupCode
  );

  const [signupTimes, setSignupTimes] = React.useState<readonly string[]>([]);

  const store = useStore();

  React.useEffect(() => {
    const fetchData = async (): Promise<void> => {
      await loadUser();
      await loadGroupMembers();
    };
    fetchData();
  }, [store]);

  React.useEffect(() => {
    const visibleGames = games.filter((game) => {
      const hidden = hiddenGames.find(
        (hiddenGame) => game.gameId === hiddenGame.gameId
      );
      if (!hidden) return game;
    });

    setSignupTimes(getOpenStartTimes(visibleGames));
  }, [hiddenGames, games, testTime]);

  const leader = isGroupLeader(groupCode, serial);

  return (
    <div className='signup-view'>
      <SignupList games={games} signupTimes={signupTimes} leader={leader} />
    </div>
  );
};
