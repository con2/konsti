// Design token value types. Applied where a token is defined, so a malformed
// color or a value in the wrong unit fails to compile instead of silently
// producing a CSS declaration the browser drops.

export type RgbColor = `rgb(${number},${number},${number})`;

export type RgbaColor = `rgba(${string})`;

export type Px = `${number}px`;

// CSS clamps out-of-range alpha silently, so only the 0-1 forms are allowed
export type Opacity = `0.${number}` | "0" | "1";
