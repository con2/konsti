import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { capitalize } from "lodash-es";
import { getWeekdayAndTime, getTime } from "client/utils/timeFormatter";
import { ProgramItem } from "shared/types/models/programItem";
import { InfoText } from "client/components/InfoText";

interface Props {
  programItem: ProgramItem;
}

export const ProgramItemInfo = ({ programItem }: Props): ReactElement => {
  const { t } = useTranslation();

  const formatTime = (): string => {
    const hours = Math.floor(programItem.mins / 60);
    const minutes = Math.round((programItem.mins / 60 - hours) * 60);

    const minutesDuration = !minutes ? `` : ` ${minutes}\xa0${t("minutes")}`;

    // Note that the dash should be an en dash
    return `${capitalize(getWeekdayAndTime(programItem.startTime))}–${getTime(programItem.endTime)} (${hours}\xa0${t("hours")}${minutesDuration})`;
  };

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!programItem) {
    return <div />;
  }

  return (
    <DetailsContainer>
      {programItem.revolvingDoor && (
        <InfoText>
          {t("programItemInfo.revolvingDoor", {
            PROGRAM_TYPE: t(`programTypeSingular.${programItem.programType}`),
            PROGRAM_TYPE2: t(`programTypeInessive.${programItem.programType}`),
          })}
        </InfoText>
      )}

      {!!programItem.mins && (
        <TwoColumnRow>
          <DetailTitle>{t("programItemInfo.runTime")}</DetailTitle>
          {formatTime()}
        </TwoColumnRow>
      )}

      {programItem.location && (
        <TwoColumnRow>
          <DetailTitle>{t("programItemInfo.location")}</DetailTitle>
          {programItem.location}
        </TwoColumnRow>
      )}

      {programItem.genres.length > 0 && (
        <TwoColumnRow>
          <DetailTitle>{t("programItemInfo.genres")}</DetailTitle>
          {programItem.genres.map((genre) => t(`genre.${genre}`)).join(", ")}
        </TwoColumnRow>
      )}

      {programItem.tags.length > 0 && (
        <TwoColumnRow>
          <DetailTitle>{t("programItemInfo.tags")}</DetailTitle>
          {programItem.tags.map((tag) => t(`tags.${tag}`)).join(", ")}
        </TwoColumnRow>
      )}

      {programItem.people && (
        <TwoColumnRow>
          <DetailTitle>{t("programItemInfo.organiser")}</DetailTitle>
          {programItem.people}
        </TwoColumnRow>
      )}

      <p>{programItem.description}</p>

      {programItem.contentWarnings && programItem.contentWarnings !== "-" && (
        <ResponsiveColumnRow>
          <DetailTitle> {t("programItemInfo.contentWarnings")}</DetailTitle>
          {programItem.contentWarnings}
        </ResponsiveColumnRow>
      )}

      {programItem.accessibilityValues.length > 0 && (
        <ResponsiveColumnRow>
          <DetailTitle>{t("programItemInfo.accessibility")}</DetailTitle>
          <AccessibilityValues>
            {programItem.accessibilityValues.map((a) => (
              <span key={a}>{t(`accessibility.${a}`)}</span>
            ))}
          </AccessibilityValues>
        </ResponsiveColumnRow>
      )}

      {programItem.otherAccessibilityInformation && (
        <ResponsiveColumnRow>
          <DetailTitle>
            {t("programItemInfo.otherAccessibilityInformation")}
          </DetailTitle>
          {programItem.otherAccessibilityInformation}
        </ResponsiveColumnRow>
      )}

      {programItem.gameSystem && (
        <ResponsiveColumnRow>
          <DetailTitle>{t("programItemInfo.otherAuthor")}</DetailTitle>
          {programItem.gameSystem}
        </ResponsiveColumnRow>
      )}

      {programItem.otherAuthor && (
        <ResponsiveColumnRow>
          <DetailTitle>{t("programItemInfo.otherAuthor")}</DetailTitle>
          {programItem.otherAuthor}
        </ResponsiveColumnRow>
      )}

      {programItem.styles.length > 0 && (
        <ResponsiveColumnRow>
          <DetailTitle>{t("programItemInfo.gameStyle")}</DetailTitle>
          {programItem.styles.map((s) => t(`gameStyle.${s}`)).join(", ")}
        </ResponsiveColumnRow>
      )}
    </DetailsContainer>
  );
};

const DetailsContainer = styled.div`
  overflow-wrap: break-word;
  word-break: break-word;
  white-space: pre-line;
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
