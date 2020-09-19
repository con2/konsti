import React, { FC, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { timeFormatter } from 'utils/timeFormatter';
import { getGameTags } from 'utils/getGameTags';
import { config } from 'config';
import { Game } from 'typings/game.typings';

export interface Props {
  game: Game;
}

export const GameInfo: FC<Props> = (props: Props): ReactElement => {
  const { game } = props;
  const { t } = useTranslation();
  const { simpleDetails } = config;

  if (!game) return <div className='game-details' />;

  const getGenres = (genresList: readonly string[]): ReactElement[] => {
    return genresList.map((genre, i) => {
      return (
        <span key={genre}>
          <span className='no-wrap'>{t(`genre.${genre}`)}</span>
          <span>{i !== genresList.length - 1 ? ', ' : ''}</span>
        </span>
      );
    });
  };

  const getStyles = (styles: readonly string[]): ReactElement[] => {
    return styles.map((style, i) => {
      return (
        <span key={style}>
          <span className='no-wrap'>{t(`gameStyle.${style}`)}</span>
          <span>{i !== styles.length - 1 ? ', ' : ''}</span>
        </span>
      );
    });
  };

  const tags = getGameTags(game);

  const tagsList = tags.map((tag, i) => {
    return (
      <span key={tag}>
        <span className='no-wrap'>{t(`gameTags.${tag}`)}</span>
        <span>{i !== tags.length - 1 ? ', ' : ''}</span>
      </span>
    );
  });

  const getFormattedStartTime = (game: Game): string =>
    timeFormatter.weekdayAndTime({
      time: game.startTime,
      capitalize: true,
    });

  const getFormattedEndTime = (game: Game): string =>
    timeFormatter.time(game.endTime);

  const getFormattedDuration = (game: Game): string => {
    const hours = Math.floor(game.mins / 60);
    const minutes = Math.round((game.mins / 60 - hours) * 60);

    if (!minutes) return `${hours} ${t('hours')}`;
    else return `${hours} ${t('hours')} ${minutes} ${t('minutes')}`;
  };

  return (
    <div className='game-details'>
      {game.title && (
        <GameDetailsRow className='game-details-row-with-subtext'>
          <GameDetailsTitleBig>{game.title}</GameDetailsTitleBig>
        </GameDetailsRow>
      )}

      {!simpleDetails && game.shortDescription && (
        <GameDetailsRow className='game-details-subtext'>
          <GameDetailsTextIndent className='italic'>
            {game.shortDescription}
          </GameDetailsTextIndent>
        </GameDetailsRow>
      )}

      {game.people && (
        <GameDetailsRow className='game-details-row-with-gap'>
          <GameDetailsTextIndent>{game.people}</GameDetailsTextIndent>
        </GameDetailsRow>
      )}

      {game.revolvingDoor && (
        <>
          <GameDetailsRow className='game-details-row-with-subtext'>
            <GameDetailsTitle>{t('gameInfo.revolvingDoor')}</GameDetailsTitle>
          </GameDetailsRow>

          <GameDetailsRow className='game-details-subtext game-details-row-with-gap'>
            <GameDetailsTextIndent>
              {t('gameInfo.revolvingDoorDescription')}
            </GameDetailsTextIndent>
          </GameDetailsRow>
        </>
      )}

      {game.ageRestricted && (
        <>
          <GameDetailsRow className='game-details-row-with-subtext'>
            <GameDetailsTitle>
              {t('gameTags.ageRestrictedTitle')}
            </GameDetailsTitle>
          </GameDetailsRow>

          <GameDetailsRow className='game-details-subtext game-details-row-with-gap'>
            <GameDetailsTextIndent>
              {t('gameTags.ageRestrictedLong')}
            </GameDetailsTextIndent>
          </GameDetailsRow>
        </>
      )}

      {!!game.mins && (
        <GameDetailsRow>
          <GameDetailsTitle className='game-details-two-columns'>
            {t('gameInfo.runTime')}
          </GameDetailsTitle>
          <GameDetailsValue>
            <span>
              {getFormattedStartTime(game)} - {getFormattedEndTime(game)}{' '}
            </span>
            <span className='no-wrap'>({getFormattedDuration(game)})</span>
          </GameDetailsValue>
        </GameDetailsRow>
      )}

      {game.programType && (
        <GameDetailsRow>
          <GameDetailsTitle className='game-details-two-columns'>
            {t('gameInfo.programType')}
          </GameDetailsTitle>
          <GameDetailsValue>
            {t(`programType.${game.programType}`)}
          </GameDetailsValue>
        </GameDetailsRow>
      )}

      {game.genres && game.genres.length > 0 && (
        <GameDetailsRow>
          <GameDetailsTitle className='game-details-two-columns'>
            {t('gameInfo.genres')}
          </GameDetailsTitle>
          <GameDetailsValue>{getGenres(game.genres)}</GameDetailsValue>
        </GameDetailsRow>
      )}

      {tagsList.length > 0 && (
        <GameDetailsRow>
          <GameDetailsTitle className='game-details-two-columns'>
            {t('gameInfo.tags')}
          </GameDetailsTitle>
          <GameDetailsValue>{tagsList}</GameDetailsValue>
        </GameDetailsRow>
      )}

      {game.description && (
        <>
          <GameDetailsRow>
            <GameDetailsTitle>{t('gameInfo.description')}</GameDetailsTitle>
          </GameDetailsRow>
          <GameDetailsRow className='game-details-row-with-gap'>
            <span>{game.description}</span>
          </GameDetailsRow>
        </>
      )}

      {!simpleDetails && game.gameSystem && (
        <GameDetailsRow>
          <GameDetailsTitle className='game-details-two-columns'>
            {t('gameInfo.gamesystem')}
          </GameDetailsTitle>
          <GameDetailsValue>{game.gameSystem}</GameDetailsValue>
        </GameDetailsRow>
      )}

      {game.styles && game.styles.length > 0 && (
        <GameDetailsRow>
          <GameDetailsTitle className='game-details-two-columns'>
            {t('gameInfo.gameStyle')}
          </GameDetailsTitle>
          <GameDetailsValue>{getStyles(game.styles)}</GameDetailsValue>
        </GameDetailsRow>
      )}

      {game.location && (
        <GameDetailsRow>
          <GameDetailsTitle className='game-details-two-columns'>
            {t('gameInfo.location')}
          </GameDetailsTitle>
          <GameDetailsValue>{game.location}</GameDetailsValue>
        </GameDetailsRow>
      )}

      {!!game.minAttendance && !!game.maxAttendance && (
        <GameDetailsRow>
          <GameDetailsTitle className='game-details-two-columns'>
            {t('gameInfo.numberOfPlayers')}
          </GameDetailsTitle>
          <GameDetailsValue>
            {game.minAttendance === game.maxAttendance
              ? game.minAttendance
              : `${game.minAttendance} - ${game.maxAttendance}`}
          </GameDetailsValue>
        </GameDetailsRow>
      )}
    </div>
  );
};

const GameDetailsRow = styled.div`
  display: flex;
  flex: 1 0 auto;
  flex-direction: row;
  padding: 0 0 10px;
  white-space: pre-wrap;
  word-wrap: break-word;

  &.game-details-row-with-subtext {
    padding: 0 0 4px;
  }

  &.game-details-subtext {
    font-size: ${(props) => props.theme.fontSizeSmall};
  }

  &.game-details-row-with-gap {
    padding: 0 0 20px;
  }
`;

const GameDetailsTitleBig = styled.h3`
  font-weight: 600;
  padding: 0 10px 0 0;
  margin: 0;
`;

const GameDetailsTitle = styled.span`
  font-weight: 600;
  padding: 0 10px 0 0;
  margin: 0;

  &.game-details-two-columns {
    width: 25%;
  }

  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
    &.game-details-two-columns {
      width: 40%;
    }
  }
`;

const GameDetailsValue = styled.span`
  width: 75%;

  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
    width: 60%;
  }
`;

const GameDetailsTextIndent = styled.span`
  margin: 0 0 0 14px;
`;
