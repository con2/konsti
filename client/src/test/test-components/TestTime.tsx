import { ChangeEvent, ReactElement, useEffect, useState } from "react";
import styled from "styled-components";
import _ from "lodash";
import dayjs from "dayjs";
import { testTimes } from "client/test/test-components/testComponentUtils";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { submitSetTestSettings } from "client/test/test-settings/testSettingsThunks";
import {
  getDate,
  getTime,
  getWeekdayAndTime,
} from "client/utils/timeFormatter";
import { Dropdown } from "client/components/Dropdown";

export const TestTime = (): ReactElement => {
  const dispatch = useAppDispatch();

  const testTime: string = useAppSelector(
    (state) => state.testSettings.testTime
  );

  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const setInitialTestTime = async (): Promise<void> => {
      const defaultTestTime = _.first(testTimes);
      if (!testTime && defaultTestTime) {
        await dispatch(submitSetTestSettings({ testTime: defaultTestTime }));
      }
    };
    setInitialTestTime();
  });

  const setTestTime = async (time: string): Promise<void> => {
    setLoading(true);
    await dispatch(submitSetTestSettings({ testTime: time }));
    setLoading(false);
  };

  const dropdownItems = testTimes.map((time) => {
    const formattedDate = `${getWeekdayAndTime(time)} (${getDate(time)})`;
    return { value: time, title: formattedDate };
  });

  return (
    <div>
      <StyledTestTime>
        {dropdownVisible ? (
          <Dropdown
            options={dropdownItems}
            selectedValue={dayjs(testTime).toISOString()}
            onChange={async (event: ChangeEvent<HTMLSelectElement>) => {
              await setTestTime(event.target.value);
              setDropdownVisible(false);
            }}
            loading={loading}
          />
        ) : (
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- Test value
          <div onClick={() => setDropdownVisible(true)}>
            {getTime(testTime)}
          </div>
        )}
      </StyledTestTime>
    </div>
  );
};

const StyledTestTime = styled.div`
  position: fixed;
  opacity: 1;
  top: 0;
  left: 0;
  font-size: 30px;
  color: red;
  z-index: 1000;

  @media (max-width: ${(props) => props.theme.breakpointDesktop}) {
    display: none;
  }
`;
