import React, { ReactElement, useEffect } from "react";
import styled from "styled-components";
import { t } from "i18next";
import _ from "lodash";
import { TestTimeSelector } from "client/test/test-components/TestTimeSelector";
import { SignupStrategySelector } from "client/test/test-components/SignupStrategySelector";
import { config } from "client/config";
import { Accordion } from "client/components/Accordion";
import { times } from "client/test/test-components/testComponentUtils";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { submitSetTestSettings } from "client/test/test-settings/testSettingsThunks";

export const TestValuePicker = (): ReactElement | null => {
  const dispatch = useAppDispatch();

  const testTime: string = useAppSelector(
    (state) => state.testSettings.testTime
  );

  useEffect(() => {
    const setInitialTestTime = async (): Promise<void> => {
      const defaultTestTime = _.first(times);
      if (!testTime && defaultTestTime) {
        await dispatch(submitSetTestSettings({ testTime: defaultTestTime }));
      }
    };
    setInitialTestTime();
  });

  const { loadedSettings, showTestValues } = config;

  if (loadedSettings === "production" || !showTestValues) {
    return null;
  }

  return (
    <TestValuesContainer>
      <Accordion toggleButton={t("testValues.buttonText")}>
        <TestValueSelectors>
          <TestTimeSelector testTime={testTime} />
          <SignupStrategySelector />
        </TestValueSelectors>
      </Accordion>
    </TestValuesContainer>
  );
};

const TestValuesContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  margin: 80px 0 0 0;
`;

const TestValueSelectors = styled.div`
  width: 200px;
  padding: 4px;
  background-color: ${(props) => props.theme.mainBackground};
`;
