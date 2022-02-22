import React, { ReactElement, ChangeEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import _ from "lodash";
import moment from "moment";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { sharedConfig } from "shared/config/sharedConfig";
import { Dropdown } from "client/components/Dropdown";
import { timeFormatter } from "client/utils/timeFormatter";
import { submitSetTestSettings } from "client/test/test-settings/testSettingsThunks";

export const TestTimeSelector = (): ReactElement => {
  const testTime: string = useAppSelector(
    (state) => state.testSettings.testTime
  );

  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const [loading, setLoading] = useState<boolean>(false);

  const { CONVENTION_START_TIME } = sharedConfig;
  const times = [
    moment(CONVENTION_START_TIME).subtract(2, "hours").format(),
    moment(CONVENTION_START_TIME).format(),
    moment(CONVENTION_START_TIME).add(45, "minutes").format(),
    moment(CONVENTION_START_TIME).add(1, "hours").add(45, "minutes").format(),
    moment(CONVENTION_START_TIME).add(2, "hours").add(45, "minutes").format(),
    moment(CONVENTION_START_TIME).add(3, "hours").add(45, "minutes").format(),
    moment(CONVENTION_START_TIME).add(5, "hours").add(45, "minutes").format(),
    moment(CONVENTION_START_TIME).add(15, "hours").add(45, "minutes").format(),
    moment(CONVENTION_START_TIME).add(16, "hours").add(45, "minutes").format(),
    moment(CONVENTION_START_TIME).add(24, "hours").add(45, "minutes").format(),
    moment(CONVENTION_START_TIME).add(28, "hours").add(45, "minutes").format(),
    moment(CONVENTION_START_TIME).add(36, "hours").add(45, "minutes").format(),
    moment(CONVENTION_START_TIME).add(40, "hours").add(45, "minutes").format(),
  ];

  const dropdownItems = times.map((time) => {
    const formattedDate = timeFormatter.getWeekdayAndTime({
      time,
      capitalize: true,
    });
    return { value: time, title: formattedDate };
  });

  useEffect(() => {
    const defaultTestTime = _.first(times);
    if (!testTime && defaultTestTime) setTestTime(defaultTestTime);
  });

  const setTestTime = async (time: string): Promise<void> => {
    setLoading(true);
    await dispatch(submitSetTestSettings({ testTime: time }));
    setLoading(false);
  };

  return (
    <div>
      <span>{t("testValues.time")}</span>{" "}
      <Dropdown
        items={dropdownItems}
        selectedValue={moment(testTime).format()}
        onChange={async (event: ChangeEvent<HTMLSelectElement>) =>
          await setTestTime(event.target.value)
        }
        loading={loading}
      />
    </div>
  );
};
