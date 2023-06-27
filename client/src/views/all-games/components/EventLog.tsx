import { ReactElement, useCallback, useEffect, useRef } from "react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Link } from "react-router-dom";
import _ from "lodash";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { submitUpdateEventLogIsSeen } from "client/views/login/loginThunks";
import { timeFormatter } from "client/utils/timeFormatter";
import { RaisedCard } from "client/components/RaisedCard";

export const EventLog = (): ReactElement => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const eventLogItems = useAppSelector((state) => state.login.eventLogItems);
  const games = useAppSelector((state) => state.allGames.games);
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
        })
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
    return timeFormatter.getWeekdayAndTime({ time: createdAt });
  };

  return (
    <div>
      <h2>{t("eventLog.title")}</h2>

      {localEventLogItems.current.length === 0 && (
        <div>{t("eventLog.noNotifications")}</div>
      )}

      {_.orderBy(
        localEventLogItems.current,
        (item) => item.createdAt,
        "desc"
      ).map((eventLogItem) => {
        const foundGame = games.find(
          (game) => game.gameId === eventLogItem.programItemId
        );
        if (!foundGame) return;
        return (
          <EventLogItem
            isSeen={eventLogItem.isSeen}
            key={eventLogItem.eventLogItemId}
          >
            <EventTitle>
              {t(`eventLogActions.${eventLogItem.action}`)}
            </EventTitle>

            <MessageCreatedAt>
              ({t("eventLog.sentTimeAgo")} {getTime(eventLogItem.createdAt)})
            </MessageCreatedAt>

            <EventDetails>
              <StyledLink to={`/games/${eventLogItem.programItemId}`}>
                {foundGame.title}
              </StyledLink>

              <StartTime>
                {t("eventLog.gameDetails", {
                  START_TIME: timeFormatter.getWeekdayAndTime({
                    time: foundGame.startTime,
                  }),
                  LOCATION: foundGame.location,
                })}
              </StartTime>
            </EventDetails>
          </EventLogItem>
        );
      })}
    </div>
  );
};

const EventLogItem = styled(RaisedCard)<{ isSeen: boolean }>`
  color: ${(props) => (props.isSeen ? "gray" : "black")};
`;

const EventTitle = styled.span`
  margin-right: 6px;
`;

const StartTime = styled.div`
  margin: 8px 0 0 0;
`;

const MessageCreatedAt = styled.span`
  white-space: nowrap;
`;

const StyledLink = styled(Link)`
  margin: 8px 0 0 0;
`;

const EventDetails = styled.div`
  margin: 8px 0 0 0;
`;
