import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslation } from "react-i18next";
import { ReactElement, useState, useEffect } from "react";
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

  const [msg, setMsg] = useState<PopularityLevel>(PopularityLevel.LOW);
  const [color, setColor] = useState<string>(theme.popularityLow);
  const [icon, setIcon] = useState<IconProp>("thermometer-0");

  useEffect(() => {
    switch (popularity) {
      case Popularity.NULL:
      case Popularity.LOW: {
        break;
      }
      case Popularity.MEDIUM: {
        setMsg(PopularityLevel.MEDIUM);
        setColor(theme.popularityMedium);
        setIcon("thermometer-1");
        break;
      }
      case Popularity.HIGH: {
        setMsg(PopularityLevel.HIGH);
        setColor(theme.popularityHigh);
        setIcon("thermometer-2");
        break;
      }
      case Popularity.VERY_HIGH: {
        setMsg(PopularityLevel.VERY_HIGH);
        setColor(theme.popularityVeryHigh);
        setIcon("thermometer-3");
        break;
      }
      case Popularity.EXTREME: {
        setMsg(PopularityLevel.EXTREME);
        setColor(theme.popularityExtreme);
        setIcon("thermometer-4");
        break;
      }
      default:
        return exhaustiveSwitchGuard(popularity);
    }
  }, [popularity]);

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
