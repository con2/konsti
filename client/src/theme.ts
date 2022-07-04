import { addOpacity } from "client/utils/addOpacity";

const white = "rgb(245,245,245)";
const black = "rgb(3,3,3)";

const redLight = "rgb(255, 153, 153)";
const red = "rgb(255,106,126)";
const redDark = "rgb(255 0 51)";

const greenLight = "rgb(235,241,222)";
const greenLight2 = "rgb(220,230,219)";
const greenLight3 = "rgb(207,225,205)";
const green = "rgb(119,147,60)";
const green2 = "rgb(60,118,61)";

const blueLight = "rgb(165,171,208)";
const blue = "rgb(77,144,254)";
const blueDark = "rgb(31,75,160)";

const grayLight = "rgb(217,217,217)";
const gray = "rgb(179,179,179)";
const grayDark = "rgb(150,150,150)";

const yellow = "rgb(234,234,173)";
const yellowDark = "rgb(214,214,166)";

export const theme = {
  // Colors
  backgroundActive: greenLight,
  backgroundBody: white,
  backgroundHighlight: white,
  backgroundHover: grayLight,
  backgroundMain: white,
  backgroundTag: blueLight,
  backgroundWarning: redLight,
  backgroundDisabled: grayLight,

  borderActive: green,
  borderDisabled: greenLight2,
  borderInactive: grayDark,
  borderInformative: black,
  borderWarning: redDark,

  buttonBackground: white,
  buttonBackgroundDisabled: greenLight2,
  buttonBorder: greenLight3,
  buttonBorderConfirm: yellowDark,
  buttonWarning: redLight,
  buttonWarningHover: addOpacity(redLight, "0.80"),
  buttonBorderWarning: redLight,
  buttonConfirm: yellow,
  buttonText: black,
  buttonTextWarning: black,

  textError: red,
  textLink: blueDark,
  textMain: black,
  textSuccess: green2,
  textTag: white,
  textWarning: redDark,

  iconFavorited: redLight,

  inputBorderFocus: blue,
  inputTextPlaceholder: gray,

  // Breakpoints
  breakpointPhone: "500px",
  breakpointTablet: "768px",
  breakpointDesktop: "1024px",

  // Font sizes
  fontSizeSmall: "14px",
  fontSizeNormal: "16px",
  fontSizeLarge: "20px",
  linkFontSize: "18px",

  // Game popularity icon colors
  popularityLow: "navy",
  popularityMedium: "darkgreen",
  popularityHigh: "darkorange",
};

export type Theme = typeof theme;
