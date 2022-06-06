import React, { ReactElement, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "react-redux";
import { HelperResultsList } from "client/views/helper/components/HelperResultsList";
import { PasswordManagement } from "client/views/helper/components/PasswordManagement";
import { loadResults, loadSettings } from "client/utils/loadData";
import { Button, ButtonStyle } from "client/components/Button";
import { SignupStrategy } from "shared/config/sharedConfig.types";
import { useAppSelector } from "client/utils/hooks";

enum HelperTool {
  RESULTS = "results",
  PASSWORD_MANAGEMENT = "passwordManagement",
}

export const HelperView = (): ReactElement => {
  const { t } = useTranslation();
  const signupStrategy = useAppSelector((state) => state.admin.signupStrategy);

  const [selectedTool, setSelectedTool] = useState<HelperTool>(
    HelperTool.PASSWORD_MANAGEMENT
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
    <div>
      {signupStrategy === SignupStrategy.ALGORITHM && (
        <Button
          buttonStyle={
            selectedTool === HelperTool.RESULTS
              ? ButtonStyle.DISABLED
              : ButtonStyle.NORMAL
          }
          onClick={() => setSelectedTool(HelperTool.RESULTS)}
        >
          {t("helperResults")}
        </Button>
      )}

      <Button
        buttonStyle={
          selectedTool === HelperTool.PASSWORD_MANAGEMENT
            ? ButtonStyle.DISABLED
            : ButtonStyle.NORMAL
        }
        onClick={() => setSelectedTool(HelperTool.PASSWORD_MANAGEMENT)}
      >
        {t("passwordManagement.helperPasswordManagement")}
      </Button>

      {selectedTool === HelperTool.RESULTS && <HelperResultsList />}
      {selectedTool === HelperTool.PASSWORD_MANAGEMENT && (
        <PasswordManagement />
      )}
    </div>
  );
};
