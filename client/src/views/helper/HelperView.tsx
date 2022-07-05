import React, { ReactElement, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "react-redux";
import { HelperResultsList } from "client/views/helper/components/HelperResultsList";
import { PasswordManagement } from "client/views/helper/components/PasswordManagement";
import {
  loadResults,
  loadSettings,
  loadSignupMessages,
} from "client/utils/loadData";
import { Button, ButtonStyle } from "client/components/Button";
import { SignupStrategy } from "shared/config/sharedConfig.types";
import { useAppSelector } from "client/utils/hooks";
import { PrivateSignupMessages } from "client/views/helper/components/PrivateSignupMessages";

enum HelperTool {
  RESULTS = "results",
  PASSWORD_MANAGEMENT = "passwordManagement",
  PRIVATE_SIGNUP_MESSAGES = "privateSignupMessages",
}

export const HelperView = (): ReactElement => {
  const { t } = useTranslation();
  const signupStrategy = useAppSelector((state) => state.admin.signupStrategy);

  const [selectedTool, setSelectedTool] = useState<HelperTool>(
    HelperTool.PRIVATE_SIGNUP_MESSAGES
  );

  const store = useStore();

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      await loadSettings();
      await loadResults();
      await loadSignupMessages();
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
          selectedTool === HelperTool.PRIVATE_SIGNUP_MESSAGES
            ? ButtonStyle.DISABLED
            : ButtonStyle.NORMAL
        }
        onClick={() => setSelectedTool(HelperTool.PRIVATE_SIGNUP_MESSAGES)}
      >
        {t("helperView.signupQuestionAnswers")}
      </Button>

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
      {selectedTool === HelperTool.PRIVATE_SIGNUP_MESSAGES && (
        <PrivateSignupMessages />
      )}
    </div>
  );
};
