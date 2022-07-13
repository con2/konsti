import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { t } from "i18next";
import React, { ReactElement, useState, useEffect } from "react";
import styled from "styled-components";
import { theme } from "client/theme";

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
  const [msg, setMsg] = useState<string>(t("gamePopularity.low"));
  const [color, setColor] = useState<string>(theme.popularityLow);
  const [icon, setIcon] = useState<IconProp>("thermometer-empty");

  useEffect(() => {
    if (popularity >= minAttendance && popularity < maxAttendance) {
      setMsg(t("gamePopularity.medium"));
      setColor(theme.popularityMedium);
      setIcon("thermometer-half");
    } else if (popularity >= maxAttendance) {
      setMsg(t("gamePopularity.high"));
      setColor(theme.popularityHigh);
      setIcon("thermometer-full");
    }
  }, [maxAttendance, minAttendance, popularity]);

  return (
    <GamePopularityContainer>
      <GamePopularityIcon icon={icon} color={color} /> {includeMsg && msg}
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
