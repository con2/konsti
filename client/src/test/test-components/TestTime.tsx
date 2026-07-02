import { ChangeEvent, ReactElement, useEffect, useState } from "react";
import styled from "styled-components";
import { first, capitalize } from "remeda";
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
} from "shared/utils/timeFormatter";
import { Dropdown } from "client/components/Dropdown";
import { config } from "shared/config";
import { isMainEventProgramVisible } from "client/utils/getUpcomingProgramItems";

export const TestTime = (): ReactElement => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();

  const testTime = useAppSelector((state) => state.testSettings.testTime);

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

  const { mainEventProgramVisibleTime } = config.event();

  const dropdownItems = testTimes.map((time) => {
    const formattedDate =
      i18n.language === "fi"
        ? `${capitalize(getShortWeekdayAndTime(time))} (${getDate(time)})`
        : `${capitalize(getShortWeekdayAndTime(time))} (${getDate(time)})`;

    // Show which times are pre-convention week and which are main event
    if (mainEventProgramVisibleTime) {
      const phase = t(
        isMainEventProgramVisible(dayjs(time))
          ? "testTime.mainEvent"
          : "testTime.preWeek",
      );
      return { value: time, title: `${phase} – ${formattedDate}` };
    }

    return { value: time, title: formattedDate };
  });

  return (
    <div>
      <StyledTestTime>
        {dropdownVisible ? (
          // Selecting the same value doesn't fire onChange, so also close on blur
          <div onBlur={() => setDropdownVisible(false)}>
            <Dropdown
              options={dropdownItems}
              selectedValue={dayjs(testTime).toISOString()}
              onChange={async (event: ChangeEvent<HTMLSelectElement>) => {
                await setTestTime(event.target.value);
              }}
              loading={loading}
            />
          </div>
        ) : (
          // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
          <div onClick={() => setDropdownVisible(true)}>
            {testTime && capitalize(getShortDate(testTime))}
            <br />
            {testTime && getTime(testTime)}
            {testTime && mainEventProgramVisibleTime && (
              <PhaseIndicator>
                {t(
                  isMainEventProgramVisible(dayjs(testTime))
                    ? "testTime.mainEvent"
                    : "testTime.preWeek",
                )}
              </PhaseIndicator>
            )}
          </div>
        )}
      </StyledTestTime>
    </div>
  );
};

const StyledTestTime = styled.div`
  font-size: 30px;
  color: red;
  width: fit-content;
  pointer-events: auto;
`;

const PhaseIndicator = styled.div`
  font-size: 16px;
`;
