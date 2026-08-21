import { useSyncExternalStore } from "react";
import { Locale } from "shared/types/locale";
import { getLocaleSnapshot, subscribeToLocale } from "shared/utils/setLocale";

// The active language, as a value React can see. The formatters otherwise read
// it from module state, which nothing re-renders on: pass this to them from any
// component that formats a time, or the compiler caches the string it first
// produced and the weekday stays in the previous language after a switch
export const useLocale = (): Locale =>
  useSyncExternalStore(subscribeToLocale, getLocaleSnapshot);
