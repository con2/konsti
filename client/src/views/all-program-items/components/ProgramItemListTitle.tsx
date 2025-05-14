import { ReactElement, useRef } from "react";
import styled from "styled-components";
import { capitalize } from "remeda";
import { getWeekdayAndTime } from "client/utils/timeFormatter";
import { MOBILE_MARGIN } from "client/globalStyle";

interface Props {
  startTime: string;
}

export const ProgramItemListTitle = ({ startTime }: Props): ReactElement => {
  const intersectionRef = useRef<HTMLDivElement | null>(null);

  return (
    <ProgramItemListTitleContainer key={startTime} ref={intersectionRef}>
      <StyledHeader>{capitalize(getWeekdayAndTime(startTime))}</StyledHeader>
    </ProgramItemListTitleContainer>
  );
};

const ProgramItemListTitleContainer = styled.div`
  z-index: 2;
  margin: 20px 0 20px 0;
  padding: 8px;
  background: #fafafa;
  color: rgb(61, 61, 61);
  border-radius: 4px;
  position: sticky;
  top: 0;
  box-shadow: ${(props) => props.theme.shadowHigher};

  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
    margin-left: -${MOBILE_MARGIN}px;
    margin-right: -${MOBILE_MARGIN}px;
    border-radius: 0;
  }

  @media (max-width: ${(props) => props.theme.breakpointDesktop}) {
    margin-left: -${MOBILE_MARGIN}px;
    margin-right: -${MOBILE_MARGIN}px;
  }
`;

const StyledHeader = styled.h2`
  margin: 4px 0 4px 0;
`;
