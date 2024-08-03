import "i18next";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { defaultNS, resources } from "client/utils/i18n";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS;
    resources: (typeof resources)["en"];

    // By default, t function can return null and we don't need that since translation keys are type safe
    // https://www.i18next.com/overview/typescript#argument-of-type-defaulttfuncreturn-is-not-assignable-to-parameter-of-type-xyz
    returnNull: false;
  }
}
