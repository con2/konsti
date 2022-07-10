import React, { ReactElement, useEffect } from "react";
import styled from "styled-components";
import { t } from "i18next";
import _ from "lodash";
import { TestTimeSelector } from "client/test/test-components/TestTimeSelector";
import { SignupStrategySelector } from "client/test/test-components/SignupStrategySelector";
import { Accordion } from "client/components/Accordion";
import { testTimes } from "client/test/test-components/testComponentUtils";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { submitSetTestSettings } from "client/test/test-settings/testSettingsThunks";

export const TestValuePicker = (): ReactElement => {
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

  return (
    <div>
      <Accordion toggleButton={t("testValues.buttonText")}>
        <TestValueSelectors>
          <TestTimeSelector testTime={testTime} />
          <SignupStrategySelector />
        </TestValueSelectors>
      </Accordion>
    </div>
  );
};

const TestValueSelectors = styled.div`
  padding: 4px;
  background-color: ${(props) => props.theme.backgroundMain};
`;
