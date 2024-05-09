import { ReactElement, ChangeEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import styled, { css } from "styled-components";
import { capitalize } from "lodash-es";
import { HiddenGamesList } from "client/views/admin/components/HiddenGamesList";
import {
  submitGetSentryTest,
  submitPlayersAssign,
  submitToggleAppOpen,
} from "client/views/admin/adminThunks";
import { submitUpdateGames } from "client/views/all-games/allGamesThunks";
import { getWeekdayAndTime } from "client/utils/timeFormatter";
import { ProgramItem } from "shared/types/models/programItem";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { Button, ButtonStyle } from "client/components/Button";
import { SignupQuestionList } from "client/views/admin/components/SignupQuestionList";
import { Dropdown, Option } from "client/components/Dropdown";
import { SignupStrategySelector } from "client/views/admin/components/SignupStrategySelector";
import { ButtonGroup } from "client/components/ButtonGroup";
import { LoginProviderSelector } from "client/views/admin/components/LoginProviderSelector";

export const AdminView = (): ReactElement => {
  const programItems = useAppSelector((state) => state.allGames.programItems);
  const appOpen = useAppSelector((state) => state.admin.appOpen);
  const hiddenGames = useAppSelector((state) => state.admin.hiddenProgramItems);
  const signupQuestions = useAppSelector(
    (state) => state.admin.signupQuestions,
  );
  const assignmentResponseMessage = useAppSelector(
    (state) => state.admin.assignmentResponseMessage,
  );

  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const getVisibleGames = (): readonly ProgramItem[] => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!hiddenGames) {
      return programItems;
    }
    const visibleProgramItems: ProgramItem[] = [];
    for (let i = 0; i < programItems.length; i += 1) {
      let match = false;

      for (let j = 0; j < hiddenGames.length; j += 1) {
        if (programItems[i].programItemId === hiddenGames[j].programItemId) {
          match = true;
          break;
        }
      }
      if (!match) {
        visibleProgramItems.push(programItems[i]);
      }
    }
    return visibleProgramItems;
  };

  const getDropdownOptions = (): Option[] => {
    const visibleGames = getVisibleGames();
    const startTimes = visibleGames.map((game) => game.startTime);
    const times = [...Array.from(new Set(startTimes))].sort();

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
      await dispatch(submitUpdateGames());
    } catch (error) {
      console.log(`submitGamesUpdate error:`, error); // eslint-disable-line no-console
    }
    setSubmitting(false);
  };

  const submitAssign = async (): Promise<void> => {
    setSubmitting(true);

    const errorMessage = await dispatch(
      submitPlayersAssign(selectedAssignmentTime),
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
            submitUpdate();
          }}
        >
          {t("button.updateDb")}
        </Button>

        <Button
          disabled={submitting}
          buttonStyle={ButtonStyle.PRIMARY}
          onClick={() => {
            toggleAppOpen();
          }}
        >
          {appOpen ? t("button.closeApp") : t("button.openApp")}
        </Button>
      </ButtonGroup>

      {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
      {(!programItems || programItems.length === 0) && (
        <p>{t("noGamesInDatabase")}</p>
      )}

      <ButtonGroup>
        <Button
          disabled={submitting}
          buttonStyle={ButtonStyle.PRIMARY}
          onClick={() => {
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

      <HiddenGamesList hiddenGames={hiddenGames} />

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
