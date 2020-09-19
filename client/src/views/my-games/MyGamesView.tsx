import React, { FC, ReactElement } from 'react';
import { useSelector, useStore } from 'react-redux';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { MySignupsList } from 'views/my-games/components/MySignupsList';
import { MyFavoritesList } from 'views/my-games/components/MyFavoritesList';
import { MyEnteredList } from 'views/my-games/components/MyEnteredList';
import {
  getUpcomingSignedGames,
  getUpcomingEnteredGames,
  getUpcomingFavorites,
} from 'utils/getUpcomingGames';
import { loadUser, loadGames, loadGroupMembers } from 'utils/loadData';
import { isGroupLeader } from 'views/group/GroupView';
import { Game } from 'typings/game.typings';
import { Signup } from 'typings/user.typings';
import { GroupMember } from 'typings/group.typings';
import { RootState } from 'typings/redux.typings';

export const MyGamesView: FC = (): ReactElement => {
  const { t } = useTranslation();

  const serial: string = useSelector((state: RootState) => state.login.serial);
  const groupCode: string = useSelector(
    (state: RootState) => state.login.groupCode
  );
  const signedGames: readonly Signup[] = useSelector(
    (state: RootState) => state.myGames.signedGames
  );
  const favoritedGames: readonly Game[] = useSelector(
    (state: RootState) => state.myGames.favoritedGames
  );
  const enteredGames: readonly Signup[] = useSelector(
    (state: RootState) => state.myGames.enteredGames
  );
  const groupMembers: readonly GroupMember[] = useSelector(
    (state: RootState) => state.login.groupMembers
  );
  const testTime: string = useSelector(
    (state: RootState) => state.admin.testTime
  );

  const [showAllGames, setShowAllGames] = React.useState<boolean>(false);

  const store = useStore();

  React.useEffect(() => {
    const fetchData = async (): Promise<void> => {
      await loadGames();
      await loadUser();
      await loadGroupMembers();
    };
    fetchData();
  }, [store, testTime]);

  const getGroupLeader = (
    groupMembers: readonly GroupMember[]
  ): GroupMember | null => {
    const groupLeader = groupMembers.find(
      (member) => member.serial === member.groupCode
    );
    if (!groupLeader) return null;
    return groupLeader;
  };

  const getSignedGames = (
    signedGames: readonly Signup[]
  ): readonly Signup[] => {
    if (isGroupLeader(groupCode, serial)) {
      if (!showAllGames) return getUpcomingSignedGames(signedGames);
      else return signedGames;
    }

    if (!isGroupLeader(groupCode, serial)) {
      const groupLeader = getGroupLeader(groupMembers);

      if (!showAllGames) {
        return getUpcomingSignedGames(
          groupLeader ? groupLeader.signedGames : signedGames
        );
      } else return groupLeader ? groupLeader.signedGames : signedGames;
    }

    return signedGames;
  };

  return (
    <div className='my-games-view'>
      <>
        <div className='my-games-toggle-visibility'>
          <button
            onClick={() => setShowAllGames(false)}
            disabled={!showAllGames}
          >
            {t('lastStartedAndUpcomingGames')}
          </button>
          <button onClick={() => setShowAllGames(true)} disabled={showAllGames}>
            {t('allGames')}
          </button>
        </div>

        <MyFavoritesList
          favoritedGames={
            showAllGames ? favoritedGames : getUpcomingFavorites(favoritedGames)
          }
        />

        {!isGroupLeader(groupCode, serial) && (
          <MyGamesGroupNotification>
            <p className='bold'>{t('inGroupSignups')}</p>
          </MyGamesGroupNotification>
        )}

        <MySignupsList signedGames={getSignedGames(signedGames)} />

        <MyEnteredList
          enteredGames={
            showAllGames ? enteredGames : getUpcomingEnteredGames(enteredGames)
          }
          signedGames={getSignedGames(signedGames)}
        />
      </>
    </div>
  );
};

const MyGamesGroupNotification = styled.div`
  margin: 30px 0 0 0;
`;
