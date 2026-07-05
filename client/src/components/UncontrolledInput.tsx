import styled from "styled-components";

export const UncontrolledInput = styled.input`
  border: 1px solid ${(props) => props.theme.borderInactive};
  box-sizing: border-box;
  border-radius: 6px;
  color: ${(props) => props.theme.textMain};
  height: 34px;
  padding: 0 0 0 8px;
  margin-right: 8px;
  width: 100%;

  &:focus {
    /* Negative outline offset keeps the focus ring inside the element so it doesn't widen on focus */
    border-color: ${(props) => props.theme.inputBorderFocus};
    outline: 2px solid ${(props) => props.theme.inputBorderFocus};
    outline-offset: -2px;
  }

  &::placeholder {
    color: ${(props) => props.theme.inputTextPlaceholder};
  }
`;
