import React, { FC, ReactElement, ChangeEvent } from 'react';
import { useSelector, useStore } from 'react-redux';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import styled from 'styled-components';
import { AllGamesList } from 'views/all-games/components/AllGamesList';
import { getUpcomingGames } from 'utils/getUpcomingGames';
import { loadGames } from 'utils/loadData';
import { config } from 'config';
import { Loading } from 'components/Loading';
import { Game } from 'typings/game.typings';
import { getTime } from 'utils/getTime';
import { RootState } from 'typings/redux.typings';

export const AllGamesView: FC = (): ReactElement => {
  const { t } = useTranslation();

  const games: readonly Game[] = useSelector(
    (state: RootState) => state.allGames.games
  );
  const testTime: string = useSelector(
    (state: RootState) => state.admin.testTime
  );
  const hiddenGames: readonly Game[] = useSelector(
    (state: RootState) => state.admin.hiddenGames
  );

  const [selectedView, setSelectedView] = React.useState<string>('upcoming');
  const [selectedTag, setSelectedTag] = React.useState<string>('');
  const [loading, setLoading] = React.useState<boolean>(false);

  const store = useStore();

  React.useEffect(() => {
    setLoading(true);
    const fetchData = async (): Promise<void> => {
      await loadGames();
      setLoading(false);
    };
    fetchData();
  }, [store, testTime]);

  const getVisibleGames = (games: readonly Game[]): readonly Game[] => {
    const filteredGames = getTagFilteredGames(games);

    const visibleGames = filteredGames.filter((game) => {
      const hidden = hiddenGames.find(
        (hiddenGame) => game.gameId === hiddenGame.gameId
      );
      if (!hidden) return game;
    });

    if (selectedView === 'upcoming') {
      return getUpcomingGames(visibleGames);
    } else if (selectedView === 'revolving-door') {
      return getUpcomingGames(visibleGames).filter(
        (game) => game.revolvingDoor
      );
    }

    return visibleGames;
  };

  const getTagFilteredGames = (games: readonly Game[]): readonly Game[] => {
    if (!selectedTag) return games;
    if (selectedTag === 'aloittelijaystavallinen') {
      return games.filter((game) => game.beginnerFriendly);
    } else if (selectedTag === 'tabletopRPG') {
      return games.filter((game) => game.programType === 'tabletopRPG');
    } else if (selectedTag === 'freeformRPG') {
      return games.filter((game) => game.programType === 'freeformRPG');
    }
    return games;
    // return games.filter(game => game.tags && game.tags.includes(selectedTag));
  };

  // const tags = ['in-english', 'aloittelijaystavallinen', 'sopii-lapsille'];
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

  const getRunningRevolvingDoorGames = (
    games: readonly Game[]
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
            {getRunningRevolvingDoorGames(games)}
          </div>
        </>
      )}

      {loading ? <Loading /> : <AllGamesList games={getVisibleGames(games)} />}
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
