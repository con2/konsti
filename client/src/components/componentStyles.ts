import { DefaultTheme } from "styled-components";

// Style variants the shared components take as props. They live apart from the
// components themselves so those modules export nothing but their component,
// which is what keeps Fast Refresh working for them.

export enum ButtonStyle {
  PRIMARY = "primary",
  SECONDARY = "secondary",
}

export enum HighlightStyle {
  INFO = "info",
  WARN = "warn",
}

export enum InfoTextVariant {
  INFO = "infoColor",
  WARNING = "warningColor",
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
