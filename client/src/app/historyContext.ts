import { createContext, useContext } from "react";
import { Location } from "react-router";

// Exported so the provider can populate it; consumers read it through the hook
export const HistoryContext = createContext<Location | null>(null);

export const usePreviousLocation = (): Location | null => {
  return useContext(HistoryContext);
};
