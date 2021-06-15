import React, { ReactElement, useEffect } from 'react';
import { useStore } from 'react-redux';
import { loadResults, loadSettings } from 'client/utils/loadData';
import { sharedConfig } from 'shared/config/sharedConfig';
import { SignupStrategy } from 'shared/config/sharedConfig.types';
import { AlgorithmResults } from 'client/views/results/components/AlgorithmResults';
import { DirectResults } from 'client/views/results/components/DirectResults';

export const ResultsView = (): ReactElement => {
  const store = useStore();

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      await loadSettings();
      await loadResults();
    };
    fetchData();
  }, [store]);

  if (sharedConfig.signupStrategy === SignupStrategy.DIRECT) {
    return <DirectResults />;
  }

  if (sharedConfig.signupStrategy === SignupStrategy.ALGORITHM) {
    return <AlgorithmResults />;
  }

  return <div />;
};
