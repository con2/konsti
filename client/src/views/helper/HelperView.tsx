import React, { ReactElement, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'react-redux';
import { HelperResultsList } from 'client/views/helper/components/HelperResultsList';
import { PasswordManagement } from 'client/views/helper/components/PasswordManagement';
import { loadResults, loadSettings } from 'client/utils/loadData';
import { Button } from 'client/components/Button';
import { sharedConfig } from 'shared/config/sharedConfig';
import { SignupStrategy } from 'shared/config/sharedConfig.types';

export const HelperView = (): ReactElement => {
  const { t } = useTranslation();

  const [selectedTool, setSelectedTool] = useState<string>(
    'password-management'
  );

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
      {sharedConfig.signupStrategy === SignupStrategy.ALGORITHM && (
        <Button
          disabled={selectedTool === 'results'}
          onClick={() => setSelectedTool('results')}
        >
          {t('helperResults')}
        </Button>
      )}
      <Button
        disabled={selectedTool === 'password-management'}
        onClick={() => setSelectedTool('password-management')}
      >
        {t('passwordManagement.helperPasswordManagement')}
      </Button>

      {selectedTool === 'results' && <HelperResultsList />}
      {selectedTool === 'password-management' && (
        <PasswordManagement allowUsernameSearch={true} />
      )}
    </div>
  );
};
