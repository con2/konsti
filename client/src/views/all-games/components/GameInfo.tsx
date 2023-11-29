import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import styled, { css } from "styled-components";
import _ from "lodash";
import { getWeekdayAndTime, getTime } from "client/utils/timeFormatter";
import { Game, GameStyle, Genre } from "shared/types/models/game";

interface Props {
  game: Game;
}

export const GameInfo = ({ game }: Props): ReactElement => {
  const { t } = useTranslation();

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!game) {
    return <div />;
  }

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
        {t(`gameTags.${tag}`)}
        <span>{i !== game.tags.length - 1 ? ", " : ""}</span>
      </span>
    );
  });

  const getFormattedStartTime = (startTime: string): string =>
    _.capitalize(getWeekdayAndTime(startTime));

  const getFormattedEndTime = (endTime: string): string => getTime(endTime);

  const getFormattedDuration = (duration: number): string => {
    const hours = Math.floor(duration / 60);
    const minutes = Math.round((duration / 60 - hours) * 60);

    if (!minutes) {
      return `${hours} ${t("hours")}`;
    }
    return `${hours} ${t("hours")} ${minutes} ${t("minutes")}`;
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
    <DetailsContainer>
      {game.revolvingDoor && (
        <>
          <GameDetailsRow $rowWithSubtext={true}>
            <GameDetailsTitle>
              {t("gameInfo.revolvingDoor", {
                PROGRAM_TYPE: t(`programTypeSingular.${game.programType}`),
              })}
            </GameDetailsTitle>
          </GameDetailsRow>

          <GameDetailsRow $subtext={true} $gap={true}>
            <GameDetailsTextIndent>
              {t("revolvingDoorInstruction", {
                PROGRAM_TYPE: t(`programTypeIllative.${game.programType}`),
                PROGRAM_TYPE2: t(`programTypeInessive.${game.programType}`),
              })}
            </GameDetailsTextIndent>
          </GameDetailsRow>
        </>
      )}

      {!!game.mins && (
        <GameDetailsRow>
          <GameDetailsTitle $twoColumns={true}>
            {t("gameInfo.runTime")}
          </GameDetailsTitle>
          <GameDetailsValue>
            <span>
              {getFormattedStartTime(game.startTime)}
              {"–"}
              {getFormattedEndTime(game.endTime)}{" "}
            </span>
            <NoWrapText>({getFormattedDuration(game.mins)})</NoWrapText>
          </GameDetailsValue>
        </GameDetailsRow>
      )}

      {game.location && (
        <GameDetailsRow>
          <GameDetailsTitle $twoColumns={true}>
            {t("gameInfo.location")}
          </GameDetailsTitle>
          <GameDetailsValue>{game.location}</GameDetailsValue>
        </GameDetailsRow>
      )}

      {/*
      {config.shared().activeProgramTypes.length > 1 && game.programType && (
        <GameDetailsRow>
          <GameDetailsTitle $twoColumns={true}>
            {t("gameInfo.programType")}
          </GameDetailsTitle>
          <GameDetailsValue>
            {t(`programType.${game.programType}`)}
          </GameDetailsValue>
        </GameDetailsRow>
      )}
      */}

      {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
      {game.genres && game.genres.length > 0 && (
        <GameDetailsRow>
          <GameDetailsTitle $twoColumns={true}>
            {t("gameInfo.genres")}
          </GameDetailsTitle>
          <GameDetailsValue>{getGenres(game.genres)}</GameDetailsValue>
        </GameDetailsRow>
      )}

      {tagsList.length > 0 && (
        <GameDetailsRow>
          <GameDetailsTitle $twoColumns={true}>
            {t("gameInfo.tags")}
          </GameDetailsTitle>
          <GameDetailsValue>{tagsList}</GameDetailsValue>
        </GameDetailsRow>
      )}

      {game.people && (
        <GameDetailsRow>
          <GameDetailsTitle $twoColumns={true}>
            {t("gameInfo.organiser")}
          </GameDetailsTitle>
          <GameDetailsValue>{game.people}</GameDetailsValue>
        </GameDetailsRow>
      )}

      {game.description && (
        <>
          <GameDetailsRow>
            <GameDetailsTitle>{t("gameInfo.description")}</GameDetailsTitle>
          </GameDetailsRow>
          <GameDetailsRow $gap={true}>
            <Description>{game.description}</Description>
          </GameDetailsRow>
        </>
      )}

      {game.contentWarnings && game.contentWarnings !== "-" && (
        <GameDetailsRow>
          <GameDetailsTitle $twoColumns={true}>
            {t("gameInfo.contentWarnings")}
          </GameDetailsTitle>
          <GameDetailsValue>{game.contentWarnings}</GameDetailsValue>
        </GameDetailsRow>
      )}

      {formattedAccessibilityValues.length > 0 && (
        <GameDetailsRow>
          <GameDetailsTitle $twoColumns={true}>
            {t("gameInfo.accessibility")}
          </GameDetailsTitle>
          <GameDetailsValue>{formattedAccessibilityValues}</GameDetailsValue>
        </GameDetailsRow>
      )}

      {game.otherAccessibilityInformation && (
        <GameDetailsRow>
          <GameDetailsTitle $twoColumns={true}>
            {t("gameInfo.otherAccessibilityInformation")}
          </GameDetailsTitle>
          <GameDetailsValue>
            {game.otherAccessibilityInformation}
          </GameDetailsValue>
        </GameDetailsRow>
      )}

      {game.gameSystem && (
        <GameDetailsRow>
          <GameDetailsTitle $twoColumns={true}>
            {t("gameInfo.gameSystem")}
          </GameDetailsTitle>
          <GameDetailsValue>{game.gameSystem}</GameDetailsValue>
        </GameDetailsRow>
      )}

      {game.otherAuthor && (
        <GameDetailsRow>
          <GameDetailsTitle $twoColumns={true}>
            {t("gameInfo.otherAuthor")}
          </GameDetailsTitle>
          <GameDetailsValue>{game.otherAuthor}</GameDetailsValue>
        </GameDetailsRow>
      )}

      {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
      {game.styles && game.styles.length > 0 && (
        <GameDetailsRow>
          <GameDetailsTitle $twoColumns={true}>
            {t("gameInfo.gameStyle")}
          </GameDetailsTitle>
          <GameDetailsValue>{getStyles(game.styles)}</GameDetailsValue>
        </GameDetailsRow>
      )}
    </DetailsContainer>
  );
};

const DetailsContainer = styled.div`
  overflow-wrap: break-word;
  word-break: break-word;
`;

interface GameDetailsRowProps {
  $rowWithSubtext?: boolean;
  $subtext?: boolean;
  $gap?: boolean;
}

const GameDetailsRow = styled.div<GameDetailsRowProps>`
  display: flex;
  flex: 1 0 auto;
  flex-direction: row;
  padding: 0 0 10px;
  white-space: pre-wrap;
  word-wrap: break-word;

  ${(gameDetailsRowProps) =>
    gameDetailsRowProps.$rowWithSubtext &&
    css`
      padding: 0 0 4px;
    `};

  ${(gameDetailsRowProps) =>
    gameDetailsRowProps.$subtext &&
    css`
      font-size: ${(props) => props.theme.fontSizeSmall};
    `};

  ${(gameDetailsRowProps) =>
    gameDetailsRowProps.$gap &&
    css`
      padding: 0 0 20px;
    `};
`;

interface GameDetailsTitleProps {
  $twoColumns?: boolean;
}

const GameDetailsTitle = styled.span<GameDetailsTitleProps>`
  font-weight: 600;
  padding: 0 10px 0 0;
  margin: 0;

  ${(gameDetailsTitleProps) =>
    gameDetailsTitleProps.$twoColumns &&
    css`
      width: 25%;

      @media (max-width: ${(props) => props.theme.breakpointPhone}) {
        width: 40%;
      }
    `};
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

const NoWrapText = styled.span`
  white-space: nowrap;
`;

const Description = styled.span`
  margin: 0 0 0 20px;
`;
