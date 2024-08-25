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

  const [selectedTool, setSelectedTool] = useState<HelperTool>(
    loginProvider === LoginProvider.LOCAL
      ? HelperTool.PASSWORD_MANAGEMENT
      : HelperTool.PRIVATE_SIGNUP_MESSAGES,
  );

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      await loadSettings();
      await loadSignupMessages();
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchData();
  }, []);

  return (
    <div>
      <ButtonGroup>
        {loginProvider === LoginProvider.LOCAL && (
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
