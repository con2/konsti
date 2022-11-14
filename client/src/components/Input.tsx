import styled from "styled-components";

export const Input = styled.input`
  border: 1px solid ${(props) => props.theme.borderInactive};
  box-sizing: border-box;
  border-radius: 6px;
  color: ${(props) => props.theme.textMain};
  height: 34px;
  padding: 0 0 0 10px;
  margin-right: 8px;
  width: 100%;

  &:focus {
    outline: 2px solid ${(props) => props.theme.inputBorderFocus};
    border: none;
  }

  &::placeholder {
    color: ${(props) => props.theme.inputTextPlaceholder};
  }
`;
