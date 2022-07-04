import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { t } from "i18next";
import React, { ReactElement } from "react";
import styled from "styled-components";
import { theme } from "client/theme";

export const formatPopularity = (
  minAttendance: number,
  maxAttendance: number,
  popularity: number,
  includeMsg: boolean
): ReactElement => {
  let msg = "";
  let color = "black";
  let icon: IconProp = "thermometer-empty";
  if (popularity < minAttendance) {
    msg = t("gamePopularity.low");
    color = theme.popularityLow;
    icon = "thermometer-empty";
  } else if (popularity >= minAttendance && popularity < maxAttendance) {
    msg = t("gamePopularity.medium");
    color = theme.popularityMedium;
    icon = "thermometer-half";
  } else if (popularity >= maxAttendance) {
    msg = t("gamePopularity.high");
    color = theme.popularityHigh;
    icon = "thermometer-full";
  }
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
