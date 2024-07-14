import styled from "styled-components";
import { ReactElement, ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { addOpacity } from "client/utils/addOpacity";

export enum InfoTextVariant {
  INFO = "infoColor",
  WARNING = "warningColor",
}

interface Props {
  children: ReactNode;
  variant?: InfoTextVariant;
}

export const InfoText = ({ children, variant }: Props): ReactElement => (
  <p>
    <Container $variant={variant ?? InfoTextVariant.INFO}>
      {variant === InfoTextVariant.WARNING && (
        <StyledIcon $color={`${variant}Icon`} icon={"triangle-exclamation"} />
      )}
      {children}
    </Container>
  </p>
);

const Container = styled.span<{
  $variant: string;
}>`
  display: inline-block;
  padding: 8px 6px;
  border-radius: 5px;

  ${(props) =>
    `
  border: 1px solid  ${props.theme[props.$variant]};
  background-color: ${addOpacity(props.theme[props.$variant], "0.23")};
    `}
`;

const StyledIcon = styled(FontAwesomeIcon)<{
  $color: string;
}>`
  padding-right: 8px;
  color: ${(props) => props.theme[props.$color]};
`;
