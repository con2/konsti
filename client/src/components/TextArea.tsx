import { ChangeEvent, ReactElement } from "react";
import styled from "styled-components";

interface Props {
  className?: string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  value: string;
}

const DEFAULT_ROW_COUNT = 4;

export const TextArea = ({
  className,
  onChange,
  rows = DEFAULT_ROW_COUNT,
  value,
}: Props): ReactElement => {
  return (
    <StyledTextArea
      className={className}
      onChange={onChange}
      rows={rows}
      value={value}
    />
  );
};

const StyledTextArea = styled.textarea`
  border: 1px solid ${(props) => props.theme.borderInactive};
  resize: none;
  overflow: auto;
  border-radius: 6px;

  &:focus {
    outline: 2px solid ${(props) => props.theme.inputBorderFocus};
    border: none;
  }

  &::placeholder {
    color: ${(props) => props.theme.inputTextPlaceholder};
  }
`;
