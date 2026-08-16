import dayjs, { Dayjs } from "dayjs";
import { ReactElement, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { sortBy } from "remeda";
import styled from "styled-components";
import { getWeekdayAndTime } from "shared/utils/timeFormatter";
import { RaisedCard } from "client/components/RaisedCard";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { useRealTimeNow } from "client/utils/useTimeNow";
import { EventLogEventMessage } from "client/views/event-log/EventLogEventMessage";
import { submitUpdateEventLogIsSeen } from "client/views/login/loginThunks";

const getTime = (createdAt: string, timeNow: Dayjs): string => {
  const relativeTimePeriod = dayjs(createdAt).add(4, "hours");

  const useRelativeTime = timeNow.isBefore(relativeTimePeriod);
  if (useRelativeTime) {
    // The clock only advances once a minute, so an item that arrived since the
    // last tick is stamped after it. Reading such an item as "in a few seconds"
    // would be nonsense, so measure those from their own timestamp
    const reference = timeNow.isBefore(createdAt) ? dayjs(createdAt) : timeNow;
    return reference.to(createdAt);
  }
  return getWeekdayAndTime(createdAt);
};

export const EventLog = (): ReactElement => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const eventLogItems = useAppSelector((state) => state.login.eventLogItems);
  const programItems = useAppSelector(
    (state) => state.allProgramItems.programItems,
  );

  // Real time rather than the mocked one: these timestamps are written by the
  // server, which the time mock doesn't move
  const timeNow = useRealTimeNow();

  // Snapshot taken once on mount: the effect below marks the items seen, which
  // updates the store, and the list would otherwise drop its unseen
  // highlighting while the user is still looking at it
  // eslint-disable-next-line react/hook-use-state -- The snapshot is never updated, so there is no setter to destructure
  const [localEventLogItems] = useState(eventLogItems);

  const setEventsSeen = useCallback((): void => {
    for (const { eventLogItemId, isSeen } of eventLogItems) {
      if (isSeen) {
        continue;
      }
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dispatch(
        submitUpdateEventLogIsSeen({
          eventLogItemId,
          isSeen: true,
        }),
      );
    }
  }, [dispatch, eventLogItems]);

  useEffect(() => {
    setEventsSeen();
  }, [setEventsSeen]);

  return (
    <div>
      <Title>{t("eventLog.title")}</Title>
      {localEventLogItems.length === 0 && (
        <RaisedCard>{t("eventLog.noNotifications")}</RaisedCard>
      )}
      {sortBy(localEventLogItems, [(item) => item.createdAt, "desc"]).map(
        (eventLogItem) => {
          return (
            <RaisedCard
              isHighlighted={!eventLogItem.isSeen}
              key={eventLogItem.eventLogItemId}
              data-testid="event-log-item"
            >
              <EventLogEventMessage
                eventLogItem={eventLogItem}
                programItems={programItems}
                showDetails={true}
              />

              <MessageCreatedAt>
                <span>{getTime(eventLogItem.createdAt, timeNow)}</span>
              </MessageCreatedAt>
            </RaisedCard>
          );
        },
      )}
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
  font-size: ${(props) => props.theme.fontSizeMainHeader};
`;
