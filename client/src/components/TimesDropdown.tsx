import React, { FC, ReactElement, ChangeEvent } from 'react';
import { timeFormatter } from 'utils/timeFormatter';

export interface Props {
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  selectedTime: string;
  times: readonly string[];
}

// TODO: Only enable next open signup
// Check current time and enable new timestamp
// Show "signup starts xx:xx" on others
// Toggle to show upcoming gameslots or all gameslots

export const TimesDropdown: FC<Props> = (props: Props): ReactElement => {
  const { times, onChange, selectedTime } = props;

  const sortedTimes = times.map((sortedTime) => {
    const formattedDate = timeFormatter.weekdayAndTime({
      time: sortedTime,
      capitalize: true,
    });
    return (
      <option value={sortedTime} key={sortedTime}>
        {formattedDate}
      </option>
    );
  });

  return (
    <div className='times-dropdown'>
      <select onChange={onChange} value={selectedTime}>
        {sortedTimes}
      </select>
    </div>
  );
};
