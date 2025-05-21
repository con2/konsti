import {
  createContext,
  useContext,
  useEffect,
  useRef,
  ReactNode,
  ReactElement,
} from "react";
import { Location, useLocation } from "react-router";

const HistoryContext = createContext<Location | null>(null);

interface Props {
  children: ReactNode;
}

export const HistoryProvider = ({ children }: Props): ReactElement => {
  const location = useLocation();
  const previousLocation = useRef<Location | null>(null);

  useEffect(() => {
    previousLocation.current = location;
  }, [location]);

  return (
    <HistoryContext.Provider value={previousLocation.current}>
      {children}
    </HistoryContext.Provider>
  );
};

export const usePreviousLocation = (): Location | null => {
  return useContext(HistoryContext);
};
