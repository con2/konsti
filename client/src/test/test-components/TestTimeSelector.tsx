import React, { ReactElement, ChangeEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import moment from "moment";
import { useAppDispatch } from "client/utils/hooks";
import { Dropdown } from "client/components/Dropdown";
import { timeFormatter } from "client/utils/timeFormatter";
import { submitSetTestSettings } from "client/test/test-settings/testSettingsThunks";
import { times } from "client/test/test-components/testComponentUtils";

interface Props {
  testTime: string;
}

export const TestTimeSelector = ({ testTime }: Props): ReactElement => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const [loading, setLoading] = useState<boolean>(false);

  const dropdownItems = times.map((time) => {
    const formattedDate = timeFormatter.getWeekdayAndTime({
      time,
      capitalize: true,
    });
    return { value: time, title: formattedDate };
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
