import { ReactElement, useCallback, useEffect, useRef } from "react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { sortBy } from "remeda";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { submitUpdateEventLogIsSeen } from "client/views/login/loginThunks";
import { getWeekdayAndTime } from "client/utils/timeFormatter";
import { RaisedCard } from "client/components/RaisedCard";
import { EventLogEventMessage } from "client/views/event-log/EventLogEventMessage";

const getTime = (createdAt: string): string => {
  const timeNow = dayjs();
  const relativeTimePeriod = dayjs(createdAt).add(4, "hours");

  const useRelativeTime = timeNow.isBefore(relativeTimePeriod);
  if (useRelativeTime) {
    return dayjs().to(createdAt);
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

  const localEventLogItems = useRef(eventLogItems);

  const setEventsSeen = useCallback((): void => {
    eventLogItems.map(({ eventLogItemId, isSeen }) => {
      if (isSeen) {
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dispatch(
        submitUpdateEventLogIsSeen({
          eventLogItemId,
          isSeen: true,
        }),
      );
    });
  }, [dispatch, eventLogItems]);

  useEffect(() => {
    setEventsSeen();
  }, [setEventsSeen]);

  return (
    <div>
      <Title>{t("eventLog.title")}</Title>

      {localEventLogItems.current.length === 0 && (
        <RaisedCard>{t("eventLog.noNotifications")}</RaisedCard>
      )}

      {sortBy(localEventLogItems.current, [
        (item) => item.createdAt,
        "desc",
      ]).map((eventLogItem) => {
        return (
          <RaisedCard
            isHighlighted={!eventLogItem.isSeen}
            key={eventLogItem.eventLogItemId}
          >
            <EventLogEventMessage
              eventLogItem={eventLogItem}
              programItems={programItems}
            />

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
