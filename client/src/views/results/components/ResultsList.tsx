import { sortBy, isEqual, groupBy, capitalize } from "lodash-es";
import { ReactElement, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getWeekdayAndTime } from "client/utils/timeFormatter";
import { useAppSelector } from "client/utils/hooks";
import { getUsersForProgramItemId } from "client/views/results/resultsUtils";
import { getUpcomingProgramItems } from "client/utils/getUpcomingProgramItems";
import { ProgramItem } from "shared/types/models/programItem";
import { selectActiveProgramItems } from "client/views/admin/adminSlice";
import { MULTIPLE_WHITESPACES_REGEX } from "client/views/all-program-items/AllProgramItemsView";
import { Tags } from "client/components/Tags";
import { getAttendeeType } from "client/utils/getAttendeeType";
import { config } from "shared/config";
import { isAdminOrHelp } from "client/utils/checkUserGroup";
import {
  ResultsStartingTimeOption,
  SearchAndFilterResultsCard,
} from "client/views/results/components/SearchAndFilterResultsCard";
import { isRevolvingDoorWorkshop } from "client/utils/isRevolvingDoorWorkshop";

export const ResultsList = (): ReactElement => {
  const { t, i18n } = useTranslation();

  const activeProgramItems = useAppSelector(selectActiveProgramItems);
  const signups = useAppSelector(
    (state) => state.allProgramItems.directSignups,
  );
  const userGroup = useAppSelector((state) => state.login.userGroup);
  isAdminOrHelp(userGroup);
  const showResults =
    config.shared().resultsVisible || isAdminOrHelp(userGroup);

  const visibleSignups = useMemo(() => {
    return showResults ? signups : [];
  }, [signups, showResults]);

  const signupQuestions = useAppSelector(
    (state) => state.admin.signupQuestions,
  );
  const hiddenProgramItems = useAppSelector(
    (state) => state.admin.hiddenProgramItems,
  );

  const [selectedStartingTime, setSelectedStartingTime] = useState<string>(
    ResultsStartingTimeOption.ALL,
  );
  const [showSignupMessages, setShowSignupMessages] = useState<string[]>([]);
  const [showAttendees, setShowAttendees] = useState<string[]>([]);

  const publicSignupQuestions = signupQuestions.filter(
    (signupQuestion) => !signupQuestion.private,
  );

  // Filter out hidden program items, revolving door workshops and program items without Konsti signup
  const visibleProgramItems = activeProgramItems
    .filter((activeProgramItem) =>
      hiddenProgramItems.every(
        (hiddenProgramItem) =>
          activeProgramItem.programItemId !== hiddenProgramItem.programItemId,
      ),
    )
    .filter((activeProgramItem) => !isRevolvingDoorWorkshop(activeProgramItem))
    .filter(
      (activeProgramItem) =>
        !config
          .shared()
          .noKonstiSignupIds.includes(activeProgramItem.programItemId),
    );

  const filteredProgramItems =
    selectedStartingTime === ResultsStartingTimeOption.ALL
      ? sortBy(visibleProgramItems, "startTime")
      : sortBy(getUpcomingProgramItems(visibleProgramItems, 1), "startTime");

  const [programItemsForListing, setProgramItemsForListing] = useState<
    readonly ProgramItem[]
  >([]);
  const [filteredProgramItemsForListing, setFilteredProgramItemsForListing] =
    useState<Record<string, ProgramItem[]>>({});
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    if (isEqual(filteredProgramItems, programItemsForListing)) {
      return;
    }

    setProgramItemsForListing(filteredProgramItems);
  }, [filteredProgramItems, programItemsForListing]);

  useEffect(() => {
    if (searchTerm.length === 0) {
      const programItemsByStartTime = groupBy<ProgramItem>(
        programItemsForListing,
        "startTime",
      );
      setFilteredProgramItemsForListing(programItemsByStartTime);
      return;
    }

    const programItemsFilteredBySearchTerm = programItemsForListing.filter(
      (programItem) => {
        const users = getUsersForProgramItemId(
          programItem.programItemId,
          visibleSignups,
        );
        return (
          programItem.title
            .replace(MULTIPLE_WHITESPACES_REGEX, " ")
            .toLocaleLowerCase()
            .includes(searchTerm.toLocaleLowerCase()) ||
          users.some((user) =>
            user.username
              .toLocaleLowerCase()
              .includes(searchTerm.toLocaleLowerCase()),
          )
        );
      },
    );

    const programItemsByStartTime = groupBy<ProgramItem>(
      programItemsFilteredBySearchTerm,
      "startTime",
    );

    setFilteredProgramItemsForListing(programItemsByStartTime);
  }, [searchTerm, programItemsForListing, visibleSignups]);

  return (
    <div>
      <h2>{t("resultsView.allSignupResults")}</h2>

      <SearchAndFilterResultsCard
        onSearchTermChange={setSearchTerm}
        onSelectedStartingTimeChange={setSelectedStartingTime}
      />

      {filteredProgramItems.length === 0 && (
        <h3>{t("resultsView.noResults")}</h3>
      )}

      {Object.entries(filteredProgramItemsForListing).map(
        ([startTime, programItemsForTime]) => {
          const sortedProgramItemsForTime = sortBy(programItemsForTime, [
            (programItem) => programItem.title.toLocaleLowerCase(),
          ]);

          return (
            <TimeSlot key={startTime}>
              <h3>{capitalize(getWeekdayAndTime(startTime))}</h3>

              <ProgramItems>
                {sortedProgramItemsForTime.map((programItem) => {
                  const signupQuestion = publicSignupQuestions.find(
                    (question) =>
                      question.programItemId === programItem.programItemId,
                  );
                  const signupMessagesVisible = showSignupMessages.find(
                    (message) => message === programItem.programItemId,
                  );
                  const attendeeListVisible = showAttendees.find(
                    (attendees) => attendees === programItem.programItemId,
                  );
                  const users = getUsersForProgramItemId(
                    programItem.programItemId,
                    visibleSignups,
                  );

                  return (
                    <div key={programItem.programItemId}>
                      <ResultTitle key={programItem.programItemId}>
                        {programItem.title}{" "}
                      </ResultTitle>
                      {config.client().activeProgramTypes.length > 1 && (
                        <Tags
                          tags={[t(`programType.${programItem.programType}`)]}
                        />
                      )}
                      <AttendeeContainer>
                        <AttendeeCount
                          onClick={() => {
                            if (attendeeListVisible) {
                              setShowAttendees(
                                showAttendees.filter(
                                  (programItemId) =>
                                    programItemId !== programItem.programItemId,
                                ),
                              );
                            } else {
                              setShowAttendees([
                                ...showAttendees,
                                programItem.programItemId,
                              ]);
                            }
                          }}
                        >
                          <span>
                            {capitalize(
                              t(
                                `attendeeTypePlural.${getAttendeeType(
                                  programItem.programType,
                                )}`,
                              ),
                            )}
                            : {users.length}/{programItem.maxAttendance}
                            {!!signupQuestion &&
                              (signupMessagesVisible ? (
                                <CommentIcon
                                  icon={"comment"}
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    setShowSignupMessages(
                                      showSignupMessages.filter(
                                        (message) =>
                                          message !== programItem.programItemId,
                                      ),
                                    );
                                  }}
                                />
                              ) : (
                                <CommentIcon
                                  icon={["far", "comment"]}
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    setShowSignupMessages([
                                      ...showSignupMessages,
                                      programItem.programItemId,
                                    ]);
                                  }}
                                />
                              ))}
                          </span>
                          <FontAwesomeIcon
                            icon={
                              attendeeListVisible ? "angle-up" : "angle-down"
                            }
                            aria-label={
                              attendeeListVisible
                                ? t("iconAltText.closeAttendeeList", {
                                    ATTENDEE_TYPE: t(
                                      `attendeeType.${getAttendeeType(
                                        programItem.programType,
                                      )}`,
                                    ),
                                  })
                                : t("iconAltText.openAttendeeList", {
                                    ATTENDEE_TYPE: t(
                                      `attendeeType.${getAttendeeType(
                                        programItem.programType,
                                      )}`,
                                    ),
                                  })
                            }
                          />
                        </AttendeeCount>
                        {attendeeListVisible && (
                          <AttendeeList>
                            {signupMessagesVisible && (
                              <SignupQuestion>
                                {i18n.language === "fi"
                                  ? signupQuestion?.questionFi
                                  : signupQuestion?.questionEn}
                              </SignupQuestion>
                            )}
                            {users.length === 0 ? (
                              <p>
                                {t("resultsView.noSignups", {
                                  ATTENDEE_TYPE: t(
                                    `attendeeTypePlural.${getAttendeeType(
                                      programItem.programType,
                                    )}`,
                                  ),
                                })}
                              </p>
                            ) : (
                              users.map((user) => (
                                <p key={user.username}>
                                  {user.username}
                                  {signupMessagesVisible && (
                                    <span>: {user.signupMessage}</span>
                                  )}
                                </p>
                              ))
                            )}
                          </AttendeeList>
                        )}
                      </AttendeeContainer>
                    </div>
                  );
                })}
              </ProgramItems>
            </TimeSlot>
          );
        },
      )}
    </div>
  );
};

const CommentIcon = styled(FontAwesomeIcon)`
  margin-left: 8px;
`;

const ResultTitle = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 4px;
  font-weight: 600;
`;

const TimeSlot = styled.div`
  border-radius: 4px;
  border: 1px solid #ddd;
  box-shadow: ${(props) => props.theme.shadowHigher};
  margin: 0 0 24px 0;
  padding: 0 10px 20px 10px;
`;

const ProgramItems = styled.div`
  display: grid;
  grid-gap: 30px;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  margin: 0 10px 0 30px;

  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
    margin-left: 10px;
  }
`;

const AttendeeList = styled.div`
  padding: 0 0 0 30px;
`;

const AttendeeContainer = styled.div`
  border: 1px solid ${(props) => props.theme.resultsFoldBorder};
  border-radius: 4px;
  background-color: ${(props) => props.theme.resultsFoldBackground};
`;

const AttendeeCount = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 4px;
  cursor: pointer;
`;

const SignupQuestion = styled.p`
  font-weight: 600;
`;
