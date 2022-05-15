export const rgbToRgba = (rgb: string, opacity: string): string => {
  const formattedRgb = rgb.replace("rgb", "").replace("(", "").replace(")", "");
  const rgba = `rgba(${formattedRgb}, ${opacity})`;
  return rgba;
};
