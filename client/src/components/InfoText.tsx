import styled from "styled-components";
import { ReactElement, ReactNode } from "react";
import { addOpacity } from "client/utils/addOpacity";

export enum InfoTextVariant {
  INFO = "infoColor",
  WARNING = "warningColor",
  ERROR = "errorColor",
}

interface Props {
  children: ReactNode;
  variant?: InfoTextVariant;
}

export const InfoText = ({ children, variant }: Props): ReactElement => (
  <Container $variant={variant ?? InfoTextVariant.INFO}>{children}</Container>
);

const Container = styled.p<{
  $variant: string;
}>`
  padding: 8px 6px;
  border-radius: 5px;

  ${(props) =>
    `
  border: 1px solid  ${props.theme[props.$variant]};
  background-color: ${addOpacity(props.theme[props.$variant], "0.23")};
    `}
`;
