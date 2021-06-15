import React, { ReactElement, useEffect, useState } from 'react';
import { useStore } from 'react-redux';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { MySignupsList } from 'client/views/my-games/components/MySignupsList';
import { MyFavoritesList } from 'client/views/my-games/components/MyFavoritesList';
import { MyEnteredList } from 'client/views/my-games/components/MyEnteredList';
import {
  getUpcomingSignedGames,
  getUpcomingEnteredGames,
  getUpcomingFavorites,
} from 'client/utils/getUpcomingGames';
import { loadUser, loadGames, loadGroupMembers } from 'client/utils/loadData';
import { isGroupLeader } from 'client/views/group/GroupView';
import { GroupMember } from 'shared/typings/api/groups';
import { SelectedGame } from 'shared/typings/models/user';
import { useAppSelector } from 'client/utils/hooks';

export const MyGamesView = (): ReactElement => {
  const { t } = useTranslation();

  const serial = useAppSelector((state) => state.login.serial);
  const groupCode = useAppSelector((state) => state.login.groupCode);
  const signedGames = useAppSelector((state) => state.myGames.signedGames);
  const favoritedGames = useAppSelector(
    (state) => state.myGames.favoritedGames
  );
  const enteredGames = useAppSelector((state) => state.myGames.enteredGames);
  const groupMembers = useAppSelector((state) => state.login.groupMembers);
  const testTime = useAppSelector((state) => state.admin.testTime);

  const [showAllGames, setShowAllGames] = useState<boolean>(false);

  const store = useStore();

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      await loadGames();
      await loadUser();
      await loadGroupMembers();
    };
    fetchData();
  }, [store, testTime]);

  return (
    <div className='my-games-view'>
      <div className='my-games-toggle-visibility'>
        <button onClick={() => setShowAllGames(false)} disabled={!showAllGames}>
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

      <MySignupsList
        signedGames={getSignedGames(
          signedGames,
          groupCode,
          serial,
          showAllGames,
          groupMembers
        )}
      />

      <MyEnteredList
        enteredGames={
          showAllGames ? enteredGames : getUpcomingEnteredGames(enteredGames)
        }
        signedGames={getSignedGames(
          signedGames,
          groupCode,
          serial,
          showAllGames,
          groupMembers
        )}
      />
    </div>
  );
};

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
  signedGames: readonly SelectedGame[],
  groupCode: string,
  serial: string,
  showAllGames: boolean,
  groupMembers: readonly GroupMember[]
): readonly SelectedGame[] => {
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

const MyGamesGroupNotification = styled.div`
  margin: 30px 0 0 0;
`;
