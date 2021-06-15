import React, { ReactElement, ChangeEvent, useState, useEffect } from 'react';
import { useStore } from 'react-redux';
import { Link } from 'react-router-dom';
import { TFunction, useTranslation } from 'react-i18next';
import moment from 'moment';
import styled from 'styled-components';
import { AllGamesList } from 'client/views/all-games/components/AllGamesList';
import { getUpcomingGames } from 'client/utils/getUpcomingGames';
import { loadGames } from 'client/utils/loadData';
import { config } from 'client/config';
import { Loading } from 'client/components/Loading';
import { Game } from 'shared/typings/models/game';
import { getTime } from 'client/utils/getTime';
import { useAppSelector } from 'client/utils/hooks';

export const AllGamesView = (): ReactElement => {
  const { t } = useTranslation();

  const games = useAppSelector((state) => state.allGames.games);
  const testTime = useAppSelector((state) => state.admin.testTime);
  const hiddenGames = useAppSelector((state) => state.admin.hiddenGames);

  const [selectedView, setSelectedView] = useState<string>('upcoming');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const store = useStore();

  useEffect(() => {
    setLoading(true);
    const fetchData = async (): Promise<void> => {
      await loadGames();
      setLoading(false);
    };
    fetchData();
  }, [store, testTime]);

  const tags = ['aloittelijaystavallinen', 'tabletopRPG', 'freeformRPG'];

  const tagsList = (): ReactElement[] => {
    return tags.map((tag) => {
      return (
        <option key={tag} value={tag}>
          {tag === 'in-english' && t(`gameTags.inEnglish`)}
          {tag === 'aloittelijaystavallinen' && t(`gameTags.beginnerFriendly`)}
          {tag === 'sopii-lapsille' && t(`gameTags.childrenFriendly`)}
          {tag === 'tabletopRPG' && t(`programType.tabletopRPG`)}
          {tag === 'freeformRPG' && t(`programType.freeformRPG`)}
        </option>
      );
    });
  };

  return (
    <>
      <AllGamesVisibilityBar>
        <AllGamesToggleVisibility>
          <button
            onClick={() => setSelectedView('upcoming')}
            disabled={selectedView === 'upcoming'}
          >
            {t('upcomingGames')}
          </button>

          <button
            onClick={() => setSelectedView('all')}
            disabled={selectedView === 'all'}
          >
            {t('allGames')}
          </button>

          {config.revolvingDoorEnabled && (
            <button
              onClick={() => setSelectedView('revolving-door')}
              disabled={selectedView === 'revolving-door'}
            >
              {t('revolvingDoor')}
            </button>
          )}
        </AllGamesToggleVisibility>

        {config.tagFilteringEnabled && (
          <TagsDropdown>
            <span className={'choose-tag-instruction'}>{t('chooseTag')} </span>
            <select
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                setSelectedTag(event.target.value)
              }
              value={selectedTag}
            >
              <option value=''>{t('allGames')}</option>
              {tagsList()}
            </select>
          </TagsDropdown>
        )}
      </AllGamesVisibilityBar>

      {selectedView === 'revolving-door' && (
        <>
          <RevolvingDoorInstruction>
            {t('revolvingDoorInstruction')}
          </RevolvingDoorInstruction>
          <div className='running-revolving-door-games'>
            <h3>{t('currentlyRunningRevolvingDoor')}</h3>
            {getRunningRevolvingDoorGames(games, t)}
          </div>
        </>
      )}

      {loading ? (
        <Loading />
      ) : (
        <AllGamesList
          games={getVisibleGames(games, hiddenGames, selectedView, selectedTag)}
        />
      )}
    </>
  );
};

const GameListShortDescription = styled.p`
  font-size: ${(props) => props.theme.fontSizeSmall};
  font-style: italic;
  margin: 4px 0 8px 14px;
`;

const AllGamesVisibilityBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
    flex-direction: column;
    align-items: flex-start;

    &.choose-tag-instruction {
      display: none;
    }
  }
`;

const getVisibleGames = (
  games: readonly Game[],
  hiddenGames: readonly Game[],
  selectedView: string,
  selectedTag: string
): readonly Game[] => {
  const filteredGames = getTagFilteredGames(games, selectedTag);

  const visibleGames = filteredGames.filter((game) => {
    const hidden = hiddenGames.find(
      (hiddenGame) => game.gameId === hiddenGame.gameId
    );
    if (!hidden) return game;
  });

  if (selectedView === 'upcoming') {
    return getUpcomingGames(visibleGames);
  } else if (selectedView === 'revolving-door') {
    return getUpcomingGames(visibleGames).filter((game) => game.revolvingDoor);
  }

  return visibleGames;
};

const getTagFilteredGames = (
  games: readonly Game[],
  selectedTag: string
): readonly Game[] => {
  if (!selectedTag) return games;
  if (selectedTag === 'aloittelijaystavallinen') {
    return games.filter((game) => game.beginnerFriendly);
  } else if (selectedTag === 'tabletopRPG') {
    return games.filter((game) => game.programType === 'tabletopRPG');
  } else if (selectedTag === 'freeformRPG') {
    return games.filter((game) => game.programType === 'freeformRPG');
  }
  return games;
};

const getRunningRevolvingDoorGames = (
  games: readonly Game[],
  t: TFunction
): ReactElement | ReactElement[] => {
  const timeNow = getTime();
  const runningGames = games.filter((game) => {
    return (
      game.revolvingDoor &&
      moment(game.startTime).isBefore(timeNow) &&
      moment(game.endTime).isAfter(timeNow)
    );
  });

  if (!runningGames || runningGames.length === 0) {
    return <p>{t('noCurrentlyRunningGames')}</p>;
  }
  return runningGames.map((game) => {
    return (
      <div key={game.gameId} className='games-list'>
        <Link to={`/games/${game.gameId}`}>{game.title}</Link>{' '}
        <GameListShortDescription>
          {game.shortDescription ? game.shortDescription : game.gameSystem}
        </GameListShortDescription>
      </div>
    );
  });
};

const RevolvingDoorInstruction = styled.div`
  margin: 100px 0 0 14px;
`;

const AllGamesToggleVisibility = styled.div`
  button {
    margin: 10px 10px 0 0;
  }
`;

const TagsDropdown = styled.div`
  margin: 10px 0 0 0;
`;
