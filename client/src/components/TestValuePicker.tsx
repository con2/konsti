import React, { ReactElement } from "react";
import styled from "styled-components";
import { t } from "i18next";
import { TestTimeSelector } from "client/test/test-components/TestTimeSelector";
import { SignupStrategySelector } from "client/test/test-components/SignupStrategySelector";
import { Accordion } from "client/components/Accordion";
import { useAppSelector } from "client/utils/hooks";
import { config } from "client/config";

export const TestValuePicker = (): ReactElement => {
  const testTime: string = useAppSelector(
    (state) => state.testSettings.testTime
  );

  return (
    <div>
      <StyledAccordion
        accordionOpenText={t("testValues.buttonText")}
        accordionClosedText={t("testValues.buttonText")}
      >
        <TestValueSelectors>
          <TestTimeSelector testTime={testTime} />
          {config.enableStrategyTestValue && <SignupStrategySelector />}
        </TestValueSelectors>
      </StyledAccordion>
    </div>
  );
};

const StyledAccordion = styled(Accordion)`
  margin: 8px;
`;

const TestValueSelectors = styled.div`
  padding: 4px;
  background-color: ${(props) => props.theme.backgroundMain};
`;
