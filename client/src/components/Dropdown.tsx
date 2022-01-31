import React, { ReactElement, ChangeEvent } from "react";

export interface Item {
  value: string;
  title: string;
}

export interface Props {
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  selectedValue: string;
  items: Item[];
}

export const Dropdown = ({
  onChange,
  selectedValue,
  items,
}: Props): ReactElement => {
  if (!items) return <div />;

  return (
    <select onChange={onChange} value={selectedValue}>
      {items.map((item) => (
        <option value={item.value} key={item.value}>
          {item.title}
        </option>
      ))}
    </select>
  );
};
