import { ReactElement, useEffect } from "react";
import { useStore } from "react-redux";
import { loadSettings } from "client/utils/loadData";
import { DirectResults } from "client/views/results/components/ResultsList";
import { useAppSelector } from "client/utils/hooks";

export const ResultsView = (): ReactElement => {
  const store = useStore();

  const testTime = useAppSelector((state) => state.testSettings.testTime);

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      await loadSettings();
    };
    fetchData();
  }, [store, testTime]);

  return <DirectResults />;
};
