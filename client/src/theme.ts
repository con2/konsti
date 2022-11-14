import { addOpacity } from "client/utils/addOpacity";

interface Palette {
  lighter: string;
  light: string;
  primary: string;
  dark: string;
  darker: string;
}

const white = "rgb(245,245,245)";
const black = "rgb(3,3,3)";

const green = {
  lighter: "rgb(127,199,130)",
  light: "rgb(85,180,88)",
  primary: "rgb(62,142,65)",
  dark: "rgb(44,99,45)",
  darker: "rgb(25,57,26)",
};

const red = {
  lighter: "rgb(255,92,105)",
  light: "rgb(255,51,68)",
  primary: "rgb(245,0,20)",
  dark: "rgb(184,0,15)",
  darker: "rgb(122,0,10)",
};

const blue = {
  lighter: "rgb(118,155,229)",
  light: "rgb(67,117,219)",
  primary: "rgb(36,87,188)",
  dark: "rgb(26,63,137)",
  darker: "rgb(16,39,86)",
};

const yellow = {
  lighter: "rgb(254,239,175)",
  light: "rgb(253,227,114)",
  primary: "rgb(252,216,54)",
  dark: "rgb(242,198,2)",
  darker: "rgb(182,149,2)",
};

const gray = {
  lighter: "rgb(184,184,184)",
  light: "rgb(153,153,153)",
  primary: "rgb(122,122,122)",
  dark: "rgb(82,82,82)",
  darker: "rgb(51,51,51)",
};

const mainColor: Palette = green;

export const theme = {
  // Colors
  backgroundBody: white,
  backgroundHighlight: white,
  backgroundHover: addOpacity(mainColor.primary, "0.3"),
  backgroundSelected: addOpacity(mainColor.primary, "0.6"),
  backgroundMain: white,
  backgroundTag: addOpacity(mainColor.primary, "0.3"),
  backgroundWarning: red.lighter,
  backgroundDisabled: gray.light,

  borderActive: mainColor.primary,
  borderDisabled: mainColor.lighter,
  borderInactive: gray.primary,
  borderWarning: red.primary,
  borderCardHighlight: mainColor.light,

  buttonPrimaryBackground: mainColor.primary,
  buttonPrimaryHover: addOpacity(mainColor.dark, "0.85"),
  buttonPrimaryClicked: mainColor.dark,
  buttonPrimaryText: white,
  buttonSecondaryBackground: white,
  buttonSecondaryBorder: mainColor.primary,
  buttonSecondaryHover: addOpacity(mainColor.primary, "0.25"),
  buttonSecondaryClicked: addOpacity(mainColor.primary, "0.5"),

  buttonBackgroundDisabled: gray.light,
  buttonText: black,

  errorCloseButtonBackground: red.light,
  errorCloseButtonBorder: red.primary,

  textError: red.primary,
  textLink: mainColor.dark,
  textMain: black,
  textSuccess: mainColor.dark,
  textTag: black,

  iconFavorited: red.light,

  inputBorderFocus: mainColor.primary,
  inputTextPlaceholder: gray.light,

  resultsFoldBackground: white,
  resultsFoldBorder: gray.primary,
  warningBackground: yellow.lighter,
  warningBorder: yellow.primary,

  infoBorder: blue.light,
  infoBackground: addOpacity(blue.light, "0.23"),

  // Breakpoints
  breakpointPhone: "768px",
  breakpointDesktop: "1024px",

  // Font sizes
  fontSizeSmaller: "12px",
  fontSizeSmall: "14px",
  fontSizeNormal: "16px",
  fontSizeLarge: "20px",
  linkFontSize: "18px",

  // Game popularity icon colors
  popularityLow: blue.primary,
  popularityMedium: green.primary,
  popularityHigh: red.primary,
};

export type Theme = typeof theme;
