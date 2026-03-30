import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslation } from "react-i18next";
import { ReactElement } from "react";
import styled from "styled-components";
import { theme } from "client/theme";
import { getAttendeeType } from "client/utils/getAttendeeType";
import { Popularity, ProgramType } from "shared/types/models/programItem";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";

enum PopularityLevel {
  LOW = "programItemPopularity.low",
  MEDIUM = "programItemPopularity.medium",
  HIGH = "programItemPopularity.high",
  VERY_HIGH = "programItemPopularity.veryHigh",
  EXTREME = "programItemPopularity.extreme",
}

interface Props {
  popularity: Popularity;
  includeMsg: boolean;
  programType: ProgramType;
  className?: string;
}

export const PopularityInfo = ({
  popularity,
  includeMsg,
  programType,
  className,
}: Props): ReactElement => {
  const { t } = useTranslation();

  const { msg, color, icon } = getPopularity(popularity);

  return (
    <ProgramItemPopularityContainer className={className}>
      {popularity !== Popularity.EXTREME && (
        <ProgramItemPopularityIcon
          icon={icon}
          color={color}
          aria-hidden="true"
        />
      )}

      {popularity === Popularity.EXTREME && (
        <IconContainer $includeMsg={includeMsg}>
          <FireIcon icon="fire" color={color} aria-hidden="true" />
          <ProgramItemPopularityIcon
            icon={icon}
            color={color}
            aria-hidden="true"
          />
        </IconContainer>
      )}

      {includeMsg && (
        <Text>
          {t(msg, {
            ATTENDEE_TYPE: t(
              `attendeeTypePlural.${getAttendeeType(programType)}`,
            ),
          })}
        </Text>
      )}
    </ProgramItemPopularityContainer>
  );
};

const getPopularity = (
  popularity: Popularity,
): {
  msg: PopularityLevel;
  color: string;
  icon: IconProp;
} => {
  switch (popularity) {
    case Popularity.NULL:
    case Popularity.LOW:
      return {
        msg: PopularityLevel.LOW,
        color: theme.popularityLow,
        icon: "thermometer-0",
      };
    case Popularity.MEDIUM:
      return {
        msg: PopularityLevel.MEDIUM,
        color: theme.popularityMedium,
        icon: "thermometer-1",
      };
    case Popularity.HIGH:
      return {
        msg: PopularityLevel.HIGH,
        color: theme.popularityHigh,
        icon: "thermometer-2",
      };
    case Popularity.VERY_HIGH:
      return {
        msg: PopularityLevel.VERY_HIGH,
        color: theme.popularityVeryHigh,
        icon: "thermometer-3",
      };
    case Popularity.EXTREME:
      return {
        msg: PopularityLevel.EXTREME,
        color: theme.popularityExtreme,
        icon: "thermometer-4",
      };
    default:
      return exhaustiveSwitchGuard(popularity);
  }
};

const ProgramItemPopularityContainer = styled.div`
  display: flex;
  flex-direction: row;
`;

const IconContainer = styled.span<{ $includeMsg: boolean }>`
  position: relative;
  width: ${(props) => (props.$includeMsg ? "34px" : "auto")};
`;

const ProgramItemPopularityIcon = styled(FontAwesomeIcon)<{
  color: string;
}>`
  color: ${(props) => props.color};
  font-size: ${(props) => props.theme.iconSizeExtra};
`;

const FireIcon = styled(FontAwesomeIcon)<{
  color: string;
}>`
  color: ${(props) => props.color};
  font-size: 14px;
  position: absolute;
  left: 17px;
  top: -4px;
`;

const Text = styled.span`
  align-content: center;
  padding-left: 6px;
`;
