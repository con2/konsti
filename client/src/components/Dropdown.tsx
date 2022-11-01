import React, { ReactElement, ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

export interface Option {
  disabled?: boolean;
  value: string;
  title: string;
}

interface Props {
  id?: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  selectedValue?: string;
  options: Option[];
  loading?: boolean;
  className?: string;
}

export const Dropdown = ({
  id,
  onChange,
  selectedValue,
  options,
  loading = false,
  className,
}: Props): ReactElement => {
  const { t } = useTranslation();

  if (!options) return <div />;

  return (
    <StyledSelect
      className={className}
      id={id}
      onChange={onChange}
      value={selectedValue}
    >
      {options.map((item) => (
        <StyledOption
          disabled={item.disabled ?? false}
          value={item.value}
          key={item.value}
        >
          {loading ? t("loading") : item.title}
        </StyledOption>
      ))}
    </StyledSelect>
  );
};

const StyledSelect = styled.select`
  border: 1px solid ${(props) => props.theme.borderInactive};
`;

const StyledOption = styled.option<{ disabled: boolean }>`
  background-color: ${(props) =>
    props.disabled
      ? props.theme.backgroundDisabled
      : props.theme.backgroundMain};
`;
