import { ReactElement, useCallback, useEffect, useRef } from "react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { orderBy } from "lodash-es";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { submitUpdateEventLogIsSeen } from "client/views/login/loginThunks";
import { getWeekdayAndTime } from "client/utils/timeFormatter";
import { RaisedCard } from "client/components/RaisedCard";
import { EventLogNewAssignment } from "client/views/event-log/EventLogNewAssignment";
import { EventLogAction } from "shared/types/models/eventLog";
import { EventLogNoAssignment } from "client/views/event-log/EventLogNoAssignment";

export const EventLog = (): ReactElement => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const eventLogItems = useAppSelector((state) => state.login.eventLogItems);
  const programItems = useAppSelector(
    (state) => state.allProgramItems.programItems,
  );
  const username = useAppSelector((state) => state.login.username);

  const localEventLogItems = useRef(eventLogItems);

  const setEventsSeen = useCallback((): void => {
    eventLogItems.map(({ eventLogItemId, isSeen }) => {
      if (isSeen) {
        return;
      }
      dispatch(
        submitUpdateEventLogIsSeen({
          username,
          eventLogItemId,
          isSeen: true,
        }),
      );
    });
  }, [dispatch, eventLogItems, username]);

  useEffect(() => {
    setEventsSeen();
  }, [setEventsSeen]);

  const getTime = (createdAt: string): string => {
    const timeNow = dayjs();
    const relativeTimePeriod = dayjs(createdAt).add(4, "hours");

    const useRelativeTime = timeNow.isBefore(relativeTimePeriod);
    if (useRelativeTime) {
      return dayjs().to(createdAt);
    }
    return getWeekdayAndTime(createdAt);
  };

  return (
    <div>
      <Title>{t("eventLog.title")}</Title>

      {localEventLogItems.current.length === 0 && (
        <RaisedCard>{t("eventLog.noNotifications")}</RaisedCard>
      )}

      {orderBy(
        localEventLogItems.current,
        (item) => item.createdAt,
        "desc",
      ).map((eventLogItem) => {
        return (
          <RaisedCard
            isHighlighted={!eventLogItem.isSeen}
            key={eventLogItem.eventLogItemId}
          >
            {eventLogItem.action === EventLogAction.NEW_ASSIGNMENT && (
              <EventLogNewAssignment
                eventLogItem={eventLogItem}
                programItems={programItems}
                showDetails={true}
              />
            )}

            {eventLogItem.action === EventLogAction.NO_ASSIGNMENT && (
              <EventLogNoAssignment eventLogItem={eventLogItem} />
            )}

            <MessageCreatedAt>
              <span>{getTime(eventLogItem.createdAt)}</span>
            </MessageCreatedAt>
          </RaisedCard>
        );
      })}
    </div>
  );
};

const MessageCreatedAt = styled.div`
  display: flex;
  justify-content: right;
  margin: 8px 4px -4px 0;
  color: ${(props) => props.theme.textSecondary};
`;

const Title = styled.h1`
  font-size: ${(props) => props.theme.mainHeaderFontSize};
`;
