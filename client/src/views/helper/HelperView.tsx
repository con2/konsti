import React, { FC, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'react-redux';
import { HelperResultsList } from 'views/helper/components/HelperResultsList';
import { PasswordManagement } from 'views/helper/components/PasswordManagement';
import { loadResults, loadSettings } from 'utils/loadData';

export const HelperView: FC = (): ReactElement => {
  const { t } = useTranslation();

  const [selectedTool, setSelectedTool] = React.useState<string>('results');

  const store = useStore();

  React.useEffect(() => {
    const fetchData = async (): Promise<void> => {
      await loadSettings();
      await loadResults();
    };
    fetchData();
  }, [store]);

  return (
    <div className='helper-view'>
      <button
        disabled={selectedTool === 'results'}
        onClick={() => setSelectedTool('results')}
      >
        {t('helperResults')}
      </button>
      <button
        disabled={selectedTool === 'password-management'}
        onClick={() => setSelectedTool('password-management')}
      >
        {t('helperPasswordManagement')}
      </button>

      <>
        {selectedTool === 'results' && <HelperResultsList />}
        {selectedTool === 'password-management' && <PasswordManagement />}
      </>
    </div>
  );
};
