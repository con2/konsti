import { ReactElement, ReactNode } from "react";
import styled, { DefaultTheme } from "styled-components";

export enum HighlightStyle {
  INFO = "info",
  WARN = "warn",
}

// The one place a highlight style maps to a colour, so a card's border and
// anything drawn beside it can't drift apart
export const getHighlightColor = (
  theme: DefaultTheme,
  highlightStyle?: HighlightStyle,
): string =>
  highlightStyle === HighlightStyle.WARN
    ? theme.borderCardWarnHighlight
    : theme.borderCardHighlight;

interface Props {
  children: ReactNode;
  className?: string;
  "data-testid"?: string;
  isHighlighted?: boolean;
  highlightStyle?: HighlightStyle;
}

export const RaisedCard = ({
  children,
  className,
  "data-testid": dataTestId,
  isHighlighted = false,
  highlightStyle,
}: Props): ReactElement => (
  <Card
    className={className}
    data-testid={dataTestId}
    $isHighlighted={isHighlighted}
    $highlightStyle={highlightStyle}
  >
    {children}
  </Card>
);

const Card = styled.div<{
  $isHighlighted: boolean;
  $highlightStyle?: HighlightStyle;
}>`
  margin: 20px 0 20px 0;
  padding: 12px 8px 12px 8px;
  border: 1px solid ${(props) => props.theme.borderCard};
  border-radius: 4px;
  background: ${(props) => props.theme.backgroundCard};
  box-shadow: ${(props) => props.theme.shadowLower};

  ${(props) =>
    props.$isHighlighted &&
    `border: 1px solid ${getHighlightColor(props.theme, props.$highlightStyle)};`}
  ${(props) =>
    props.$isHighlighted &&
    `border-left: 5px solid ${getHighlightColor(props.theme, props.$highlightStyle)};`}
`;
