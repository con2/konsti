import { ReactElement, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PasswordManagement } from "client/views/helper/components/PasswordManagement";
import { loadSettings, loadSignupMessages } from "client/utils/loadData";
import { Button, ButtonStyle } from "client/components/Button";
import { PrivateSignupMessages } from "client/views/helper/components/PrivateSignupMessages";
import { ButtonGroup } from "client/components/ButtonGroup";
import { useAppSelector } from "client/utils/hooks";
import { LoginProvider } from "shared/config/eventConfigTypes";

enum HelperTool {
  PASSWORD_MANAGEMENT = "passwordManagement",
  PRIVATE_SIGNUP_MESSAGES = "privateSignupMessages",
}

export const HelperView = (): ReactElement => {
  const { t } = useTranslation();

  const loginProvider = useAppSelector((state) => state.admin.loginProvider);
  const kompassiId = useAppSelector((state) => state.login.kompassiId);
  const isLocalLogin = !kompassiId;

  const [selectedTool, setSelectedTool] = useState<HelperTool>(
    loginProvider === LoginProvider.KOMPASSI
      ? HelperTool.PRIVATE_SIGNUP_MESSAGES
      : HelperTool.PASSWORD_MANAGEMENT,
  );

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      // This loads signup questions
      await loadSettings();
      // This loads signup question answers
      await loadSignupMessages();
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchData();
  }, []);

  return (
    <div>
      <ButtonGroup>
        {isLocalLogin && (
          <Button
            disabled={selectedTool === HelperTool.PASSWORD_MANAGEMENT}
            buttonStyle={ButtonStyle.SECONDARY}
            onClick={() => setSelectedTool(HelperTool.PASSWORD_MANAGEMENT)}
          >
            {t("passwordManagement.helperPasswordManagement")}
          </Button>
        )}

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
