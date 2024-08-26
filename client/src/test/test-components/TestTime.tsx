import { ChangeEvent, ReactElement, useEffect, useState } from "react";
import styled from "styled-components";
import { first, capitalize } from "lodash-es";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { testTimes } from "client/test/test-components/testComponentUtils";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { submitSetTestSettings } from "client/test/test-settings/testSettingsThunks";
import {
  getDate,
  getShortDate,
  getShortWeekdayAndTime,
  getTime,
} from "client/utils/timeFormatter";
import { Dropdown } from "client/components/Dropdown";

export const TestTime = (): ReactElement => {
  const { i18n } = useTranslation();
  const dispatch = useAppDispatch();

  const testTime: string = useAppSelector(
    (state) => state.testSettings.testTime,
  );

  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const setInitialTestTime = async (): Promise<void> => {
      const defaultTestTime = first(testTimes);
      if (!testTime && defaultTestTime) {
        await dispatch(submitSetTestSettings({ testTime: defaultTestTime }));
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    setInitialTestTime();
  });

  const setTestTime = async (time: string): Promise<void> => {
    setLoading(true);
    await dispatch(submitSetTestSettings({ testTime: time }));
    setLoading(false);
    setDropdownVisible(false);
  };

  const dropdownItems = testTimes.map((time) => {
    const formattedDate =
      i18n.language === "fi"
        ? `${capitalize(getShortWeekdayAndTime(time))} (${getDate(time)})`
        : `${capitalize(getShortWeekdayAndTime(time))} (${getDate(time)})`;
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
            }}
            loading={loading}
          />
        ) : (
          // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
          <div onClick={() => setDropdownVisible(true)}>
            {i18n.language === "fi" ? (
              <>
                {capitalize(getShortDate(testTime))}
                <br />
                {getTime(testTime)}
              </>
            ) : (
              <>
                {capitalize(getShortDate(testTime))}
                <br />
                {getTime(testTime)}
              </>
            )}
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
