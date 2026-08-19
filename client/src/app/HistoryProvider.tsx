import { ReactElement, ReactNode, useState } from "react";
import { Location, useLocation } from "react-router";
import { HistoryContext } from "client/app/historyContext";

interface Props {
  children: ReactNode;
}

export const HistoryProvider = ({ children }: Props): ReactElement => {
  const location = useLocation();
  const [visited, setVisited] = useState<{
    current: Location;
    previous: Location | null;
  }>({ current: location, previous: null });

  // Adjusted while rendering rather than in an effect, so a view mounting for
  // the new location already sees the one it came from. Keeping the location
  // the pair was derived from is what makes a re-render that doesn't navigate
  // leave the pair alone, instead of promoting the current location to being
  // its own predecessor
  if (visited.current !== location) {
    setVisited({ current: location, previous: visited.current });
  }

  return (
    <HistoryContext.Provider value={visited.previous}>
      {children}
    </HistoryContext.Provider>
  );
};
