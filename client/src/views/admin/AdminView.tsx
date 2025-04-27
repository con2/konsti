import { ReactElement, ChangeEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import styled, { css } from "styled-components";
import { capitalize } from "lodash-es";
import { HiddenProgramItemsList } from "client/views/admin/components/HiddenProgramItemsList";
import {
  submitGetSentryTest,
  submitAssignment,
  submitToggleAppOpen,
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
    try {
      await dispatch(submitUpdateProgramItems());
    } catch (error) {
      console.log(`submitProgramItemsUpdate error:`, error); // eslint-disable-line no-console
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
    try {
      await dispatch(submitToggleAppOpen(!appOpen));
    } catch (error) {
      console.log(`submitToggleAppOpen error:`, error); // eslint-disable-line no-console
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
