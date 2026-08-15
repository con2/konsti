import { Px, RgbColor } from "client/types/styleTypes";
import { addOpacity } from "client/utils/addOpacity";

interface Palette {
  lighter: RgbColor;
  light: RgbColor;
  primary: RgbColor;
  dark: RgbColor;
  darker: RgbColor;
}

interface GrayPalette extends Palette {
  lightest: RgbColor;
}

const offWhite: RgbColor = "rgb(250,250,250)";
const white: RgbColor = "rgb(245,245,245)";

const black: RgbColor = "rgb(3,3,3)";
const pureBlack: RgbColor = "rgb(0,0,0)";

const green: Palette = {
  lighter: "rgb(127,199,130)",
  light: "rgb(85,180,88)",
  primary: "rgb(62,142,65)",
  dark: "rgb(44,99,45)",
  darker: "rgb(25,57,26)",
};

const red: Palette = {
  lighter: "rgb(255,92,105)",
  light: "rgb(255,51,68)",
  primary: "rgb(245,0,20)",
  dark: "rgb(184,0,15)",
  darker: "rgb(122,0,10)",
};

const blue: Palette = {
  lighter: "rgb(118,155,229)",
  light: "rgb(67,117,219)",
  primary: "rgb(36,87,188)",
  dark: "rgb(26,63,137)",
  darker: "rgb(16,39,86)",
};

const yellow: Palette = {
  lighter: "rgb(254,239,175)",
  light: "rgb(253,227,114)",
  primary: "rgb(252,216,54)",
  dark: "rgb(242,198,2)",
  darker: "rgb(182,149,2)",
};

const gray: GrayPalette = {
  lightest: "rgb(221,221,221)",
  lighter: "rgb(184,184,184)",
  light: "rgb(153,153,153)",
  primary: "rgb(122,122,122)",
  dark: "rgb(82,82,82)",
  darker: "rgb(51,51,51)",
};

const mainColor: Palette = green;

const popularity = {
  blue: "rgb(64,106,188)",
  green: green.primary,
  orange: "rgb(249,137,48)",
  red: "rgb(240,1,20)",
  magenta: "rgb(160,6,81)",
} satisfies Record<string, RgbColor>;

export const theme = {
  // Colors
  backgroundBody: white,
  backgroundHighlight: white,
  backgroundHover: addOpacity(mainColor.primary, "0.3"),
  backgroundSelected: addOpacity(mainColor.primary, "0.6"),
  backgroundMain: white,
  backgroundTag: addOpacity(mainColor.primary, "0.3"),
  backgroundCard: offWhite,
  backgroundDisabled: gray.light,
  backgroundHeader: offWhite,
  backgroundDimmer: black,

  borderActive: mainColor.primary,
  borderInactive: gray.primary,
  borderCard: gray.lightest,
  borderCardHighlight: mainColor.light,
  borderCardWarnHighlight: red.light,
  borderHeader: gray.lightest,
  borderNavigation: black,
  tabBorder: gray.light,

  buttonPrimaryBackground: mainColor.primary,
  buttonPrimaryHover: addOpacity(mainColor.dark, "0.85"),
  buttonPrimaryClicked: mainColor.dark,
  buttonPrimaryText: white,
  buttonSecondaryBackground: white,
  buttonSecondaryBorder: mainColor.primary,
  buttonSecondaryHover: addOpacity(mainColor.primary, "0.25"),
  buttonSecondaryClicked: addOpacity(mainColor.primary, "0.5"),

  formAccent: mainColor.primary,

  // Text colors
  textError: red.primary,
  textLink: mainColor.dark,
  textActiveTab: mainColor.dark,
  textInactiveTab: gray.darker,
  textMain: black,
  textLighter: gray.darker,
  textTag: black,
  textSecondary: gray.primary,

  iconFavorite: mainColor.primary,
  iconDefault: mainColor.primary,

  inputBorderFocus: mainColor.primary,
  inputTextPlaceholder: gray.light,

  infoColor: blue.light,
  infoColorBackground: addOpacity(blue.light, "0.23"),
  warningColor: yellow.primary,
  warningColorBackground: addOpacity(yellow.primary, "0.23"),
  warningColorIcon: yellow.darker,
  errorColor: red.light,
  errorColorBackground: addOpacity(red.light, "0.23"),
  errorColorIcon: red.dark,

  // Breakpoints. The Min variants sit just above the plain value so a viewport
  // exactly at the breakpoint - iPad portrait is 768px, landscape 1024px -
  // matches the max-width side only
  breakpointPhone: "768px" satisfies Px,
  breakpointPhoneMin: "768.02px" satisfies Px,
  breakpointDesktop: "1024px" satisfies Px,
  breakpointDesktopMin: "1024.02px" satisfies Px,

  // Font sizes
  fontSizeSmaller: "12px" satisfies Px,
  fontSizeSmall: "14px" satisfies Px,
  fontSizeNormal: "16px" satisfies Px,
  fontSizeLarge: "20px" satisfies Px,
  fontSizeLink: "18px" satisfies Px,
  fontSizeMainHeader: "24px" satisfies Px,

  // Icon sizes
  iconSizeSmall: "16px" satisfies Px,
  iconSizeNormal: "20px" satisfies Px,
  iconSizeLarge: "24px" satisfies Px,
  iconSizeExtra: "30px" satisfies Px,

  // Program item popularity icon colors
  popularityLow: popularity.blue,
  popularityMedium: popularity.green,
  popularityHigh: popularity.orange,
  popularityVeryHigh: popularity.red,
  popularityExtreme: popularity.magenta,

  // Shadows
  shadowLower: `0 3px 4px ${addOpacity(pureBlack, "0.12")}, 0 3px 4px ${addOpacity(pureBlack, "0.19")}`,
  shadowHigher: `0 8px 18px ${addOpacity(pureBlack, "0.15")}, 0 4px 4px ${addOpacity(pureBlack, "0.21")}`,
  shadowButton: `${addOpacity(pureBlack, "0.18")} 0 3px 5px`,
  shadowHeader: `4px 4px 45px 4px ${addOpacity(pureBlack, "0.1")}`,
};

export type Theme = typeof theme;
