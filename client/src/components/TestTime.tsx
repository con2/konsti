import { ReactElement, useEffect } from "react";
import styled from "styled-components";
import _ from "lodash";
import { testTimes } from "client/test/test-components/testComponentUtils";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { submitSetTestSettings } from "client/test/test-settings/testSettingsThunks";
import { getTime } from "client/utils/timeFormatter";

export const TestTime = (): ReactElement => {
  const dispatch = useAppDispatch();

  const testTime: string = useAppSelector(
    (state) => state.testSettings.testTime
  );

  useEffect(() => {
    const setInitialTestTime = async (): Promise<void> => {
      const defaultTestTime = _.first(testTimes);
      if (!testTime && defaultTestTime) {
        await dispatch(submitSetTestSettings({ testTime: defaultTestTime }));
      }
    };
    setInitialTestTime();
  });

  return <StyledTestTime>{getTime(testTime)}</StyledTestTime>;
};

const StyledTestTime = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  font-size: 30px;
  color: red;

  @media (max-width: ${(props) => props.theme.breakpointDesktop}) {
    display: none;
  }
`;
