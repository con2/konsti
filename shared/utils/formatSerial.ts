// Registration codes are printed in groups of three digits, e.g. 012-304-800-1
const addDashesRegex = /(.{3})(?=.)/g;

export const formatSerial = (serial: string): string =>
  serial.replaceAll(addDashesRegex, "$1-");
