import React, { ReactElement, useEffect } from "react";
import { useStore } from "react-redux";
import { loadResults, loadSettings } from "client/utils/loadData";
import { SignupStrategy } from "shared/config/sharedConfig.types";
import { AlgorithmResults } from "client/views/results/components/AlgorithmResults";
import { DirectResults } from "client/views/results/components/DirectResults";
import { useAppSelector } from "client/utils/hooks";

export const ResultsView = (): ReactElement => {
  const store = useStore();

  const testTime = useAppSelector((state) => state.testSettings.testTime);
  const signupStrategy = useAppSelector((state) => state.admin.signupStrategy);

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      await loadSettings();
      await loadResults();
    };
    fetchData();
  }, [store, testTime]);

  if (
    signupStrategy === SignupStrategy.DIRECT ||
    signupStrategy === SignupStrategy.ALGORITHM_AND_DIRECT
  ) {
    return <DirectResults />;
  }

  if (signupStrategy === SignupStrategy.ALGORITHM) {
    return <AlgorithmResults />;
  }

  return <div />;
};
