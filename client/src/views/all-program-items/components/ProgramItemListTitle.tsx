import dayjs from "dayjs";
import { ReactElement, useRef } from "react";
import { capitalize } from "remeda";
import styled from "styled-components";
import { MOBILE_MARGIN } from "client/globalStyle";
import { useTimeNow } from "client/utils/useTimeNow";
import { getFormattedTime } from "client/views/program-item/programItemUtils";

interface Props {
  startTime: string;
}

export const ProgramItemListTitle = ({ startTime }: Props): ReactElement => {
  const intersectionRef = useRef<HTMLDivElement | null>(null);

  return (
    <ProgramItemListTitleContainer key={startTime} ref={intersectionRef}>
      {/* Include the date outside event week so the weekday isn't ambiguous */}
      <StyledHeader>
        {capitalize(getFormattedTime(dayjs(startTime), useTimeNow()))}
      </StyledHeader>
    </ProgramItemListTitleContainer>
  );
};

const ProgramItemListTitleContainer = styled.div`
  z-index: 2;
  margin: 20px 0 20px 0;
  padding: 8px;
  background: ${(props) => props.theme.backgroundCard};
  color: ${(props) => props.theme.textLighter};
  border-radius: 4px;
  position: sticky;
  top: 0;
  box-shadow: ${(props) => props.theme.shadowHigher};

  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
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
