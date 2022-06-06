import React, { ReactElement, ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

export interface Item {
  value: string;
  title: string;
}

interface Props {
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  selectedValue: string;
  items: Item[];
  loading?: boolean;
}

export const Dropdown = ({
  onChange,
  selectedValue,
  items,
  loading = false,
}: Props): ReactElement => {
  const { t } = useTranslation();

  if (!items) return <div />;

  return (
    <StyledSelect onChange={onChange} value={selectedValue}>
      {items.map((item) => (
        <option value={item.value} key={item.value}>
          {loading ? t("loading") : item.title}
        </option>
      ))}
    </StyledSelect>
  );
};

const StyledSelect = styled.select`
  width: 200px;
`;
