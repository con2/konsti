import { useEffect, useState } from "react";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "client/typings/redux.typings";

// Use instead of plain `useDispatch`
/* eslint-disable-next-line ban/ban */
export const useAppDispatch = (): AppDispatch => useDispatch<AppDispatch>();

// Use instead of plain `useSelector`
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const useDebounce = <T>(value: T, delay?: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay ?? 500);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};
