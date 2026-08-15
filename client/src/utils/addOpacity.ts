import { Opacity, RgbColor, RgbaColor } from "client/types/styleTypes";

export const addOpacity = (rgb: RgbColor, opacity: Opacity): RgbaColor => {
  const formattedRgb = rgb.replace("rgb", "").replace("(", "").replace(")", "");
  const rgba: RgbaColor = `rgba(${formattedRgb}, ${opacity})`;
  return rgba;
};
