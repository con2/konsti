import styled from "styled-components";
import { UncontrolledInput } from "client/components/UncontrolledInput";

export const EmailInput = styled(UncontrolledInput)`
  width: min(250px, 100%);
  ${(props) =>
    props.disabled &&
    `
      background-color: ${props.theme.backgroundDisabled};
      cursor: not-allowed;
      opacity: 0.6;
    `};
`;
