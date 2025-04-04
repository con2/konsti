import styled from "styled-components";
import { ReactElement, ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export enum InfoTextVariant {
  INFO = "infoColor",
  WARNING = "warningColor",
}

interface Props {
  children: ReactNode;
  variant?: InfoTextVariant;
  className?: string;
}

export const InfoText = ({
  children,
  variant,
  className,
}: Props): ReactElement => (
  <p className={className}>
    <Container $variant={variant ?? InfoTextVariant.INFO}>
      {variant === InfoTextVariant.WARNING && (
        <StyledIcon $variant={variant} icon={"triangle-exclamation"} />
      )}
      {children}
    </Container>
  </p>
);

const Container = styled.span<{
  $variant: InfoTextVariant;
}>`
  display: inline-block;
  padding: 8px 6px;
  border-radius: 5px;

  ${(props) =>
    `
    border: 1px solid  ${props.theme[props.$variant]};
    background-color: ${props.theme[`${props.$variant}Background`]};
  `}
`;

const StyledIcon = styled(FontAwesomeIcon)<{
  $variant: InfoTextVariant.WARNING;
}>`
  padding-right: 8px;

  ${(props) =>
    `
      color: ${props.theme[`${props.$variant}Icon`]};
  `}
`;
