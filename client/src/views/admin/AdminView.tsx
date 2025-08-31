import { ReactElement, ChangeEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import styled, { css } from "styled-components";
import { capitalize } from "remeda";
import { HiddenProgramItemsList } from "client/views/admin/components/HiddenProgramItemsList";
import {
  submitGetSentryTest,
  submitAssignment,
  submitToggleAppOpen,
  submitEmailTest,
} from "client/views/admin/adminThunks";
import { submitUpdateProgramItems } from "client/views/all-program-items/allProgramItemsThunks";
import { getWeekdayAndTime } from "client/utils/timeFormatter";
import { ProgramItem } from "shared/types/models/programItem";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { Button, ButtonStyle } from "client/components/Button";
import { SignupQuestionList } from "client/views/admin/components/SignupQuestionList";
import { Dropdown, Option } from "client/components/Dropdown";
import { SignupStrategySelector } from "client/views/admin/components/SignupStrategySelector";
import { ButtonGroup } from "client/components/ButtonGroup";
import { LoginProviderSelector } from "client/views/admin/components/LoginProviderSelector";
import { selectHiddenProgramItems } from "client/views/admin/adminSlice";
import { EmailNotificationTrigger } from "shared/types/emailNotification";

export const AdminView = (): ReactElement => {
  const programItems = useAppSelector(
    (state) => state.allProgramItems.programItems,
  );
  const appOpen = useAppSelector((state) => state.admin.appOpen);
  const hiddenProgramItems = useAppSelector(selectHiddenProgramItems);
  const signupQuestions = useAppSelector(
    (state) => state.admin.signupQuestions,
  );
  const assignmentResponseMessage = useAppSelector(
    (state) => state.admin.assignmentResponseMessage,
  );

  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const getVisibleProgramItems = (): readonly ProgramItem[] => {
    const visibleProgramItems: ProgramItem[] = [];

    for (const programItem of programItems) {
      let match = false;

      for (const hiddenProgramItem of hiddenProgramItems) {
        if (programItem.programItemId === hiddenProgramItem.programItemId) {
          match = true;
          break;
        }
      }
      if (!match) {
        visibleProgramItems.push(programItem);
      }
    }
    return visibleProgramItems;
  };

  const getDropdownOptions = (): Option[] => {
    const visibleProgramItems = getVisibleProgramItems();
    // TODO: Add logic for 'startTimesByParentIds' config
    const startTimes = visibleProgramItems.map(
      (programItem) => programItem.startTime,
    );
    const times = [...new Set(startTimes)].sort();

    return times.map((time) => {
      const formattedDate = capitalize(getWeekdayAndTime(time));
      return { value: time, title: formattedDate };
    });
  };

  const assignmentTimeDropdownValues = getDropdownOptions();
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [messageStyle, setMessageStyle] = useState<string>("");
  const [selectedAssignmentTime, setSelectedAssignmentTime] = useState<string>(
    assignmentTimeDropdownValues[0]?.value ?? "",
  );
  const [testEmail, setTestEmail] = useState<string>("");
  const [testProgramId, setTestProgramId] = useState<string>("");

  const showMessage = ({
    value,
    style,
  }: {
    value: string;
    style: string;
  }): void => {
    setMessage(value);
    setMessageStyle(style);
  };

  const submitUpdate = async (): Promise<void> => {
    setSubmitting(true);
    const errorMessage = await dispatch(submitUpdateProgramItems());

    if (errorMessage) {
      showMessage({
        value: errorMessage,
        style: "error",
      });
    }

    setSubmitting(false);
  };

  const submitAssign = async (): Promise<void> => {
    setSubmitting(true);

    const errorMessage = await dispatch(
      submitAssignment(selectedAssignmentTime),
    );

    if (errorMessage) {
      showMessage({
        value: errorMessage,
        style: "error",
      });
    }

    setSubmitting(false);
  };

  const toggleAppOpen = async (): Promise<void> => {
    setSubmitting(true);

    const errorMessage = await dispatch(submitToggleAppOpen(!appOpen));

    if (errorMessage) {
      showMessage({
        value: errorMessage,
        style: "error",
      });
    }

    setSubmitting(false);
  };

  const sendTestEmail = async (
    notificationType: EmailNotificationTrigger,
  ): Promise<void> => {
    if (!testEmail) {
      showMessage({
        value: "Please enter an email address",
        style: "error",
      });
      return;
    }

    if (!testProgramId) {
      showMessage({
        value: "Please enter a program ID",
        style: "error",
      });
      return;
    }

    setSubmitting(true);

    const errorMessage = await dispatch(
      submitEmailTest(testEmail, notificationType, testProgramId),
    );

    if (errorMessage) {
      showMessage({
        value: errorMessage,
        style: "error",
      });
    } else {
      showMessage({
        value: `Test ${notificationType} email sent to ${testEmail}`,
        style: "success",
      });
    }

    setSubmitting(false);
  };

  return (
    <div>
      <ButtonGroup>
        <Button
          disabled={submitting}
          buttonStyle={ButtonStyle.PRIMARY}
          onClick={() => {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            submitUpdate();
          }}
        >
          {t("button.updateDb")}
        </Button>

        <Button
          disabled={submitting}
          buttonStyle={ButtonStyle.PRIMARY}
          onClick={() => {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            toggleAppOpen();
          }}
        >
          {appOpen ? t("button.closeApp") : t("button.openApp")}
        </Button>
      </ButtonGroup>

      {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
      {(!programItems || programItems.length === 0) && (
        <p>{t("noProgramItemsInDatabase")}</p>
      )}

      <ButtonGroup>
        <Button
          disabled={submitting}
          buttonStyle={ButtonStyle.PRIMARY}
          onClick={() => {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            submitAssign();
          }}
        >
          {t("button.assignAttendees")}
        </Button>
        <Dropdown
          options={getDropdownOptions()}
          selectedValue={selectedAssignmentTime}
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            setSelectedAssignmentTime(event.target.value)
          }
        />
      </ButtonGroup>

      {!submitting && (
        <>
          <StatusMessage $messageStyle={messageStyle}>{message}</StatusMessage>

          <AssignmentResponseMessage>
            {assignmentResponseMessage}
          </AssignmentResponseMessage>
        </>
      )}

      {submitting && <p>{t("loading")}</p>}

      <SignupStrategySelector />

      <LoginProviderSelector />

      <HiddenProgramItemsList hiddenProgramItems={hiddenProgramItems} />

      <SignupQuestionList
        signupQuestions={signupQuestions}
        programItems={programItems}
      />

      <h3>{t("admin.sentryTesting")}</h3>
      <ButtonGroup>
        <Button
          buttonStyle={ButtonStyle.PRIMARY}
          onClick={() => {
            const value = undefined;
            // @ts-expect-error: Sentry test value
            console.log(value.sentryTestValue); // eslint-disable-line no-console
          }}
        >
          {t("admin.sentryClientTest")}
        </Button>
        <Button
          buttonStyle={ButtonStyle.PRIMARY}
          onClick={async () => {
            await dispatch(submitGetSentryTest());
          }}
        >
          {t("admin.sentryBackendTest")}
        </Button>
      </ButtonGroup>

      <h3>Email Notification Testing</h3>
      <EmailTestForm>
        <input
          type="email"
          placeholder="Enter email address"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          disabled={submitting}
        />
        <input
          type="text"
          placeholder="Enter program ID"
          value={testProgramId}
          onChange={(e) => setTestProgramId(e.target.value)}
          disabled={submitting}
        />
        <ButtonGroup>
          <Button
            disabled={submitting || !testEmail || !testProgramId}
            buttonStyle={ButtonStyle.PRIMARY}
            onClick={() => {
              // eslint-disable-next-line @typescript-eslint/no-floating-promises
              sendTestEmail(EmailNotificationTrigger.ACCEPTED);
            }}
          >
            Send ACCEPTED Test
          </Button>
          <Button
            disabled={submitting || !testEmail || !testProgramId}
            buttonStyle={ButtonStyle.PRIMARY}
            onClick={() => {
              // eslint-disable-next-line @typescript-eslint/no-floating-promises
              sendTestEmail(EmailNotificationTrigger.REJECTED);
            }}
          >
            Send REJECTED Test
          </Button>
        </ButtonGroup>
      </EmailTestForm>
    </div>
  );
};

const StatusMessage = styled.p<{ $messageStyle: string }>`
  ${(statusMessageProps) =>
    statusMessageProps.$messageStyle === "success" &&
    css`
      color: ${(props) => props.theme.textSecondary};
    `};

  ${(statusMessageProps) =>
    statusMessageProps.$messageStyle === "error" &&
    css`
      color: ${(props) => props.theme.textError};
    `};
`;

const AssignmentResponseMessage = styled.p`
  color: ${(props) => props.theme.textSecondary};
`;

const EmailTestForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;

  input {
    padding: 8px 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
    max-width: 300px;
  }
`;
