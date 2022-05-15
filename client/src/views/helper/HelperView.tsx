import React, { ReactElement, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "react-redux";
import { HelperResultsList } from "client/views/helper/components/HelperResultsList";
import { PasswordManagement } from "client/views/helper/components/PasswordManagement";
import { loadResults, loadSettings } from "client/utils/loadData";
import { Button, ButtonStyle } from "client/components/Button";
import { SignupStrategy } from "shared/config/sharedConfig.types";
import { useAppSelector } from "client/utils/hooks";

export const HelperView = (): ReactElement => {
  const { t } = useTranslation();
  const signupStrategy = useAppSelector((state) => state.admin.signupStrategy);

  const [selectedTool, setSelectedTool] = useState<string>(
    "password-management"
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
            selectedTool === "results"
              ? ButtonStyle.DISABLED
              : ButtonStyle.NORMAL
          }
          onClick={() => setSelectedTool("results")}
        >
          {t("helperResults")}
        </Button>
      )}
      <Button
        buttonStyle={
          selectedTool === "password-management"
            ? ButtonStyle.DISABLED
            : ButtonStyle.NORMAL
        }
        onClick={() => setSelectedTool("password-management")}
      >
        {t("passwordManagement.helperPasswordManagement")}
      </Button>

      {selectedTool === "results" && <HelperResultsList />}
      {selectedTool === "password-management" && <PasswordManagement />}
    </div>
  );
};
