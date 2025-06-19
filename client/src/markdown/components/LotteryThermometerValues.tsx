import { ReactElement } from "react";
import styled from "styled-components";
import { PopularityInfo } from "client/components/PopularityInfo";
import { Popularity, ProgramType } from "shared/types/models/programItem";

export const LotteryThermometerValues = (): ReactElement => {
  return (
    <Icons>
      <PopularityInfo
        popularity={Popularity.LOW}
        includeMsg={true}
        programType={ProgramType.WORKSHOP}
      />
      <PopularityInfo
        popularity={Popularity.MEDIUM}
        includeMsg={true}
        programType={ProgramType.WORKSHOP}
      />
      <PopularityInfo
        popularity={Popularity.HIGH}
        includeMsg={true}
        programType={ProgramType.WORKSHOP}
      />
      <PopularityInfo
        popularity={Popularity.VERY_HIGH}
        includeMsg={true}
        programType={ProgramType.WORKSHOP}
      />
      <PopularityInfo
        popularity={Popularity.EXTREME}
        includeMsg={true}
        programType={ProgramType.WORKSHOP}
      />
    </Icons>
  );
};

const Icons = styled.div`
  display: flex;
  flex-direction: column;

  div {
    padding-top: 10px;
  }
`;
