import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslation } from "react-i18next";
import { ReactElement, useState, useEffect } from "react";
import styled from "styled-components";
import { theme } from "client/theme";

enum PopularityLevel {
  LOW = "gamePopularity.low",
  MEDIUM = "gamePopularity.medium",
  HIGH = "gamePopularity.high",
}

interface Props {
  minAttendance: number;
  maxAttendance: number;
  popularity: number;
  includeMsg: boolean;
}

export const PopularityInfo = ({
  minAttendance,
  maxAttendance,
  popularity,
  includeMsg,
}: Props): ReactElement => {
  const { t } = useTranslation();

  const [msg, setMsg] = useState<PopularityLevel>(PopularityLevel.LOW);
  const [color, setColor] = useState<string>(theme.popularityLow);
  const [icon, setIcon] = useState<IconProp>("thermometer-empty");

  useEffect(() => {
    if (popularity >= minAttendance && popularity < maxAttendance) {
      setMsg(PopularityLevel.MEDIUM);
      setColor(theme.popularityMedium);
      setIcon("thermometer-half");
    } else if (popularity >= maxAttendance) {
      setMsg(PopularityLevel.HIGH);
      setColor(theme.popularityHigh);
      setIcon("thermometer-full");
    }
  }, [maxAttendance, minAttendance, popularity]);

  return (
    <GamePopularityContainer>
      <GamePopularityIcon icon={icon} color={color} aria-hidden="true" />{" "}
      {includeMsg && <span>{t(msg)}</span>}
    </GamePopularityContainer>
  );
};

const GamePopularityContainer = styled.div`
  display: flex;
  flex-direction: row;
  margin-bottom: 5px;
`;

const GamePopularityIcon = styled(FontAwesomeIcon)<{
  color: string;
}>`
  color: ${(props) => props.color};
  margin-right: 5px;
  font-size: 30px;
  margin-top: -5px;
`;
