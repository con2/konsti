import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { capitalize } from "remeda";
import { getTime, getWeekdayAndTime } from "client/utils/timeFormatter";
import { ProgramItem } from "shared/types/models/programItem";
import { InfoText, InfoTextVariant } from "client/components/InfoText";
import { TextWithLinks } from "client/markdown/components/TextWithLinks";

interface Props {
  programItem: ProgramItem;
}

export const ProgramItemDetails = ({ programItem }: Props): ReactElement => {
  const { t } = useTranslation();

  const formatTime = (): string => {
    const hours = Math.floor(programItem.mins / 60);
    const minutes = Math.round((programItem.mins / 60 - hours) * 60);

    const minutesDuration = minutes ? ` ${minutes}\u00A0${t("minutes")}` : "";

    // Note that the dash should be an en dash
    return `${capitalize(getWeekdayAndTime(programItem.startTime))}–${getTime(programItem.endTime)} (${hours}\u00A0${t("hours")}${minutesDuration})`;
  };

  return (
    <DetailsContainer>
      {programItem.revolvingDoor && (
        <InfoText variant={InfoTextVariant.INFO}>
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

      <p>
        <TextWithLinks>{programItem.description}</TextWithLinks>
      </p>

      {programItem.contentWarnings && programItem.contentWarnings !== "-" && (
        <ResponsiveColumnRow>
          <DetailTitle> {t("programItemInfo.contentWarnings")}</DetailTitle>
          {programItem.contentWarnings}
        </ResponsiveColumnRow>
      )}

      {programItem.accessibilityValues.length > 0 && (
        <ResponsiveColumnRow>
          <DetailTitle>{t("programItemInfo.inclusivity")}</DetailTitle>
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
          <DetailTitle>{t("programItemInfo.gameSystem")}</DetailTitle>
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
          <DetailTitle>{t("programItemInfo.gamestyle")}</DetailTitle>
          {programItem.styles.map((s) => t(`gamestyle.${s}`)).join(", ")}
        </ResponsiveColumnRow>
      )}
    </DetailsContainer>
  );
};

const DetailsContainer = styled.div`
  overflow-wrap: break-word;
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
