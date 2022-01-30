import React, { ReactElement, ChangeEvent, useEffect } from "react";
import { useTranslation } from "react-i18next";
import _ from "lodash";
import moment from "moment";
import styled from "styled-components";
import { submitSetTestTime } from "client/views/admin/adminSlice";
import { TimesDropdown } from "client/components/TimesDropdown";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { sharedConfig } from "shared/config/sharedConfig";

export const TestTimeSelector = (): ReactElement => {
  const testTime: string = useAppSelector((state) => state.admin.testTime);

  const dispatch = useAppDispatch();
  const { t } = useTranslation();

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

  useEffect(() => {
    const defaultTestTime = _.first(times);
    if (!testTime && defaultTestTime) setTestTime(defaultTestTime);
  });

  const setTestTime = (time: string): void => {
    dispatch(submitSetTestTime(time));
  };

  return (
    <TimeSelectorElement>
      <span>{t("testTime")}</span>
      <TimesDropdown
        times={times}
        selectedTime={testTime}
        onChange={(event: ChangeEvent<HTMLSelectElement>) =>
          setTestTime(event.target.value)
        }
      />
    </TimeSelectorElement>
  );
};

const TimeSelectorElement = styled.div`
  height: 50px;
`;
