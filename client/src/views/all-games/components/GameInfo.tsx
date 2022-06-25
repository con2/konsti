import React, { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import styled, { css } from "styled-components";
import { timeFormatter } from "client/utils/timeFormatter";
import { Game, GameStyle, Genre } from "shared/typings/models/game";

interface Props {
  game: Game;
}

export const GameInfo = ({ game }: Props): ReactElement => {
  const { t } = useTranslation();

  if (!game) return <div />;

  const getGenres = (genresList: readonly Genre[]): ReactElement[] => {
    return genresList.map((genre, i) => {
      return (
        <span key={genre}>
          <NoWrapText>{t(`genre.${genre}`)}</NoWrapText>
          <span>{i !== genresList.length - 1 ? ", " : ""}</span>
        </span>
      );
    });
  };

  const getStyles = (styles: readonly GameStyle[]): ReactElement[] => {
    return styles.map((style, i) => {
      return (
        <span key={style}>
          <NoWrapText>{t(`gameStyle.${style}`)}</NoWrapText>
          <span>{i !== styles.length - 1 ? ", " : ""}</span>
        </span>
      );
    });
  };

  const tagsList = game.tags.map((tag, i) => {
    return (
      <span key={tag}>
        <NoWrapText>{t(`gameTags.${tag}`)}</NoWrapText>
        <span>{i !== game.tags.length - 1 ? ", " : ""}</span>
      </span>
    );
  });

  const getFormattedStartTime = (startTime: string): string =>
    timeFormatter.getWeekdayAndTime({
      time: startTime,
      capitalize: true,
    });

  const getFormattedEndTime = (endTime: string): string =>
    timeFormatter.getTime(endTime);

  const getFormattedDuration = (duration: number): string => {
    const hours = Math.floor(duration / 60);
    const minutes = Math.round((duration / 60 - hours) * 60);

    if (!minutes) return `${hours} ${t("hours")}`;
    else return `${hours} ${t("hours")} ${minutes} ${t("minutes")}`;
  };

  const getFormattedAccessibility = (): ReactElement[] => {
    return game.accessibilityValues.map((accessibilityValue) => {
      return (
        <StyledAccessibilityValue key={accessibilityValue}>
          {t(`accessibility.${accessibilityValue}`)}
        </StyledAccessibilityValue>
      );
    });
  };

  const formattedAccessibilityValues = getFormattedAccessibility();

  return (
    <div>
      {game.title && (
        <GameDetailsRow rowWithSubtext={true}>
          <GameDetailsTitleBig>{game.title}</GameDetailsTitleBig>
        </GameDetailsRow>
      )}

      {game.shortDescription && (
        <GameDetailsRow subtext={true}>
          <GameDetailsTextIndent>
            <ItalicText>{game.shortDescription}</ItalicText>
          </GameDetailsTextIndent>
        </GameDetailsRow>
      )}

      {game.people && (
        <GameDetailsRow gap={true}>
          <GameDetailsTextIndent>{game.people}</GameDetailsTextIndent>
        </GameDetailsRow>
      )}

      {game.revolvingDoor && (
        <>
          <GameDetailsRow rowWithSubtext={true}>
            <GameDetailsTitle>{t("gameInfo.revolvingDoor")}</GameDetailsTitle>
          </GameDetailsRow>

          <GameDetailsRow subtext={true} gap={true}>
            <GameDetailsTextIndent>
              {t("gameInfo.revolvingDoorDescription")}
            </GameDetailsTextIndent>
          </GameDetailsRow>
        </>
      )}

      {!!game.mins && (
        <GameDetailsRow>
          <GameDetailsTitle twoColumns={true}>
            {t("gameInfo.runTime")}
          </GameDetailsTitle>
          <GameDetailsValue>
            <span>
              {getFormattedStartTime(game.startTime)} -{" "}
              {getFormattedEndTime(game.endTime)}{" "}
            </span>
            <NoWrapText>({getFormattedDuration(game.mins)})</NoWrapText>
          </GameDetailsValue>
        </GameDetailsRow>
      )}

      {game.programType && (
        <GameDetailsRow>
          <GameDetailsTitle twoColumns={true}>
            {t("gameInfo.programType")}
          </GameDetailsTitle>
          <GameDetailsValue>
            {t(`programType.${game.programType}`)}
          </GameDetailsValue>
        </GameDetailsRow>
      )}

      {game.genres && game.genres.length > 0 && (
        <GameDetailsRow>
          <GameDetailsTitle twoColumns={true}>
            {t("gameInfo.genres")}
          </GameDetailsTitle>
          <GameDetailsValue>{getGenres(game.genres)}</GameDetailsValue>
        </GameDetailsRow>
      )}

      {tagsList.length > 0 && (
        <GameDetailsRow>
          <GameDetailsTitle twoColumns={true}>
            {t("gameInfo.tags")}
          </GameDetailsTitle>
          <GameDetailsValue>{tagsList}</GameDetailsValue>
        </GameDetailsRow>
      )}

      {game.contentWarnings && game.contentWarnings !== "-" && (
        <GameDetailsRow>
          <GameDetailsTitle twoColumns={true}>
            {t("gameInfo.contentWarnings")}
          </GameDetailsTitle>
          <GameDetailsValue>{game.contentWarnings}</GameDetailsValue>
        </GameDetailsRow>
      )}

      {game.otherAuthor && (
        <GameDetailsRow>
          <GameDetailsTitle twoColumns={true}>
            {t("gameInfo.otherAuthor")}
          </GameDetailsTitle>
          <GameDetailsValue>{game.otherAuthor}</GameDetailsValue>
        </GameDetailsRow>
      )}

      {formattedAccessibilityValues.length > 0 && (
        <GameDetailsRow>
          <GameDetailsTitle twoColumns={true}>
            {t("gameInfo.accessibility")}
          </GameDetailsTitle>
          <GameDetailsValue>{formattedAccessibilityValues}</GameDetailsValue>
        </GameDetailsRow>
      )}

      {game.otherInaccessibility && (
        <GameDetailsRow>
          <GameDetailsTitle twoColumns={true}>
            {t("gameInfo.otherInaccessibility")}
          </GameDetailsTitle>
          <GameDetailsValue>{game.otherInaccessibility}</GameDetailsValue>
        </GameDetailsRow>
      )}

      {game.description && (
        <>
          <GameDetailsRow>
            <GameDetailsTitle>{t("gameInfo.description")}</GameDetailsTitle>
          </GameDetailsRow>
          <GameDetailsRow gap={true}>
            <span>{game.description}</span>
          </GameDetailsRow>
        </>
      )}

      {game.gameSystem && (
        <GameDetailsRow>
          <GameDetailsTitle twoColumns={true}>
            {t("gameInfo.gamesystem")}
          </GameDetailsTitle>
          <GameDetailsValue>{game.gameSystem}</GameDetailsValue>
        </GameDetailsRow>
      )}

      {game.styles && game.styles.length > 0 && (
        <GameDetailsRow>
          <GameDetailsTitle twoColumns={true}>
            {t("gameInfo.gameStyle")}
          </GameDetailsTitle>
          <GameDetailsValue>{getStyles(game.styles)}</GameDetailsValue>
        </GameDetailsRow>
      )}

      {game.location && (
        <GameDetailsRow>
          <GameDetailsTitle twoColumns={true}>
            {t("gameInfo.location")}
          </GameDetailsTitle>
          <GameDetailsValue>{game.location}</GameDetailsValue>
        </GameDetailsRow>
      )}

      {!!game.minAttendance && !!game.maxAttendance && (
        <GameDetailsRow>
          <GameDetailsTitle twoColumns={true}>
            {t("gameInfo.numberOfPlayers")}
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

interface GameDetailsRowProps {
  rowWithSubtext?: boolean;
  subtext?: boolean;
  gap?: boolean;
}

const GameDetailsRow = styled.div<GameDetailsRowProps>`
  display: flex;
  flex: 1 0 auto;
  flex-direction: row;
  padding: 0 0 10px;
  white-space: pre-wrap;
  word-wrap: break-word;

  ${(gameDetailsRowProps) =>
    gameDetailsRowProps.rowWithSubtext &&
    css`
      padding: 0 0 4px;
    `};

  ${(gameDetailsRowProps) =>
    gameDetailsRowProps.subtext &&
    css`
      font-size: ${(props) => props.theme.fontSizeSmall};
    `};

  ${(gameDetailsRowProps) =>
    gameDetailsRowProps.gap &&
    css`
      padding: 0 0 20px;
    `};
`;

const GameDetailsTitleBig = styled.h3`
  font-weight: 600;
  padding: 0 10px 0 0;
  margin: 0;
`;

interface GameDetailsTitleProps {
  twoColumns?: boolean;
}

const GameDetailsTitle = styled.span<GameDetailsTitleProps>`
  font-weight: 600;
  padding: 0 10px 0 0;
  margin: 0;

  ${(gameDetailsTitleProps) =>
    gameDetailsTitleProps.twoColumns &&
    css`
      width: 25%;
    `};

  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
    ${(gameDetailsTitleProps) =>
      gameDetailsTitleProps.twoColumns &&
      css`
        width: 40%;
      `};
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

const StyledAccessibilityValue = styled.p`
  margin: 0 0 6px 0;
`;

const ItalicText = styled.span`
  font-style: italic;
`;

const NoWrapText = styled.span`
  white-space: nowrap;
`;
