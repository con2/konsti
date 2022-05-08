import React, { ReactElement } from "react";
import styled from "styled-components";
import { t } from "i18next";
import { TestTimeSelector } from "client/test/test-components/TestTimeSelector";
import { SignupStrategySelector } from "client/test/test-components/SignupStrategySelector";
import { config } from "client/config";
import { Accordion } from "client/components/Accordion";

export const TestValuePicker = (): ReactElement | null => {
  const { loadedSettings, showTestValues } = config;

  if (loadedSettings === "production" || !showTestValues) {
    return null;
  }

  return (
    <TestValuesContainer>
      <Accordion toggleButton={t("testValues.buttonText")}>
        <TestValueSelectors>
          <TestTimeSelector />
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
