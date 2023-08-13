import { ReactElement, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "react-redux";
import { PasswordManagement } from "client/views/helper/components/PasswordManagement";
import { loadSettings, loadSignupMessages } from "client/utils/loadData";
import { Button, ButtonStyle } from "client/components/Button";
import { PrivateSignupMessages } from "client/views/helper/components/PrivateSignupMessages";
import { ButtonGroup } from "client/components/ButtonGroup";

enum HelperTool {
  PASSWORD_MANAGEMENT = "passwordManagement",
  PRIVATE_SIGNUP_MESSAGES = "privateSignupMessages",
}

export const HelperView = (): ReactElement => {
  const { t } = useTranslation();

  const [selectedTool, setSelectedTool] = useState<HelperTool>(
    HelperTool.PASSWORD_MANAGEMENT,
  );

  const store = useStore();

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      await loadSettings();
      await loadSignupMessages();
    };
    fetchData();
  }, [store]);

  return (
    <div>
      <ButtonGroup>
        <Button
          disabled={selectedTool === HelperTool.PASSWORD_MANAGEMENT}
          buttonStyle={ButtonStyle.SECONDARY}
          onClick={() => setSelectedTool(HelperTool.PASSWORD_MANAGEMENT)}
        >
          {t("passwordManagement.helperPasswordManagement")}
        </Button>

        <Button
          disabled={selectedTool === HelperTool.PRIVATE_SIGNUP_MESSAGES}
          buttonStyle={ButtonStyle.SECONDARY}
          onClick={() => setSelectedTool(HelperTool.PRIVATE_SIGNUP_MESSAGES)}
        >
          {t("helperView.signupQuestionAnswers")}
        </Button>
      </ButtonGroup>
      {selectedTool === HelperTool.PASSWORD_MANAGEMENT && (
        <PasswordManagement />
      )}
      {selectedTool === HelperTool.PRIVATE_SIGNUP_MESSAGES && (
        <PrivateSignupMessages />
      )}
    </div>
  );
};
