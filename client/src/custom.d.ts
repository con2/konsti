declare module '*.gif' {
  const content: string;
  export = content;
}

declare module '*.svg' {
  const src: string;
  export = src;
}

declare const SETTINGS: 'production' | 'staging' | 'development';
