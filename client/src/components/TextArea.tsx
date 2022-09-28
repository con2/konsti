import styled from "styled-components";

export const Textarea = styled.textarea`
  border: 1px solid ${(props) => props.theme.borderInactive};
  resize: none;
  overflow: auto;
  border-radius: 4px;
`;
