import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { capitalize } from "lodash-es";
import { getWeekdayAndTime, getTime } from "client/utils/timeFormatter";
import { ProgramItem } from "shared/types/models/programItem";
import { InfoText } from "client/components/InfoText";

interface Props {
  game: ProgramItem;
}

export const GameInfo = ({ game }: Props): ReactElement => {
  const { t } = useTranslation();

  const formatTime = () => {
    const hours = Math.floor(game.mins / 60);
    const minutes = Math.round((game.mins / 60 - hours) * 60);

    const minutesDuration = !minutes ? `` : ` ${minutes}\xa0${t("minutes")}`;

    // Note that the dash should be an en dash
    return `${capitalize(getWeekdayAndTime(game.startTime))}–${getTime(game.endTime)} (${hours}\xa0${t("hours")}${minutesDuration})`;
  };

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!game) {
    return <div />;
  }

  return (
    <DetailsContainer>
      {game.revolvingDoor && (
        <InfoText>
          {t("gameInfo.revolvingDoor", {
            PROGRAM_TYPE: t(`programTypeSingular.${game.programType}`),
            PROGRAM_TYPE2: t(`programTypeInessive.${game.programType}`),
          })}
        </InfoText>
      )}

      {!!game.mins && (
        <TwoColumnRow>
          <DetailTitle>{t("gameInfo.runTime")}</DetailTitle>
          {formatTime()}
        </TwoColumnRow>
      )}

      {game.location && (
        <TwoColumnRow>
          <DetailTitle>{t("gameInfo.location")}</DetailTitle>
          {game.location}
        </TwoColumnRow>
      )}

      {game.genres.length > 0 && (
        <TwoColumnRow>
          <DetailTitle>{t("gameInfo.genres")}</DetailTitle>
          {game.genres.map((genre) => t(`genre.${genre}`)).join(", ")}
        </TwoColumnRow>
      )}

      {game.tags.length > 0 && (
        <TwoColumnRow>
          <DetailTitle>{t("gameInfo.tags")}</DetailTitle>
          {game.tags.map((tag) => t(`gameTags.${tag}`)).join(", ")}
        </TwoColumnRow>
      )}

      {game.people && (
        <TwoColumnRow>
          <DetailTitle>{t("gameInfo.organiser")}</DetailTitle>
          {game.people}
        </TwoColumnRow>
      )}

      <p>{game.description}</p>

      {game.contentWarnings && game.contentWarnings !== "-" && (
        <ResponsiveColumnRow>
          <DetailTitle> {t("gameInfo.contentWarnings")}</DetailTitle>
          {game.contentWarnings}
        </ResponsiveColumnRow>
      )}

      {game.accessibilityValues.length > 0 && (
        <ResponsiveColumnRow>
          <DetailTitle>{t("gameInfo.accessibility")}</DetailTitle>
          <AccessibilityValues>
            {game.accessibilityValues.map((a) => (
              <span key={a}>{t(`accessibility.${a}`)}</span>
            ))}
          </AccessibilityValues>
        </ResponsiveColumnRow>
      )}

      {game.otherAccessibilityInformation && (
        <ResponsiveColumnRow>
          <DetailTitle>
            {t("gameInfo.otherAccessibilityInformation")}
          </DetailTitle>
          {game.otherAccessibilityInformation}
        </ResponsiveColumnRow>
      )}

      {game.gameSystem && (
        <ResponsiveColumnRow>
          <DetailTitle>{t("gameInfo.otherAuthor")}</DetailTitle>
          {game.gameSystem}
        </ResponsiveColumnRow>
      )}

      {game.otherAuthor && (
        <ResponsiveColumnRow>
          <DetailTitle>{t("gameInfo.otherAuthor")}</DetailTitle>
          {game.otherAuthor}
        </ResponsiveColumnRow>
      )}

      {game.styles.length > 0 && (
        <ResponsiveColumnRow>
          <DetailTitle>{t("gameInfo.gameStyle")}</DetailTitle>
          {game.styles.map((s) => t(`gameStyle.${s}`)).join(", ")}
        </ResponsiveColumnRow>
      )}
    </DetailsContainer>
  );
};

const DetailsContainer = styled.div`
  overflow-wrap: break-word;
  word-break: break-word;
`;

const TwoColumnRow = styled.div`
  display: flex;
  flex-direction: row;
  margin: 8px 0 0 0;
`;

const ResponsiveColumnRow = styled(TwoColumnRow)`
  row-gap: 4px;

  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
    flex-direction: column;
  }
`;

const DetailTitle = styled.h4`
  flex: 0 0 25%;
  margin: 0;

  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
    flex: 0 0 45%;
  }
`;

const AccessibilityValues = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 4px;
`;
