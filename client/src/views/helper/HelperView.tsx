import React, { ReactElement, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'react-redux';
import { HelperResultsList } from 'client/views/helper/components/HelperResultsList';
import { PasswordManagement } from 'client/views/helper/components/PasswordManagement';
import { loadResults, loadSettings } from 'client/utils/loadData';
import { Button } from 'client/components/Button';

export const HelperView = (): ReactElement => {
  const { t } = useTranslation();

  const [selectedTool, setSelectedTool] = useState<string>('results');

  const store = useStore();

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      await loadSettings();
      await loadResults();
    };
    fetchData();
  }, [store]);

  return (
    <div className='helper-view'>
      <Button
        disabled={selectedTool === 'results'}
        onClick={() => setSelectedTool('results')}
      >
        {t('helperResults')}
      </Button>
      <Button
        disabled={selectedTool === 'password-management'}
        onClick={() => setSelectedTool('password-management')}
      >
        {t('helperPasswordManagement')}
      </Button>

      {selectedTool === 'results' && <HelperResultsList />}
      {selectedTool === 'password-management' && <PasswordManagement />}
    </div>
  );
};
