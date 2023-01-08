import "i18next";

declare module "i18next" {
  interface CustomTypeOptions {
    // By default, t function can return null and we don't need that since translation keys are type safe
    // https://www.i18next.com/overview/typescript#argument-of-type-defaulttfuncreturn-is-not-assignable-to-parameter-of-type-xyz
    returnNull: false;
  }
}
