import { ReactElement, useCallback, useEffect } from "react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Link } from "react-router-dom";
import _ from "lodash";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { submitUpdateEventLogIsSeen } from "client/views/login/loginThunks";
import { timeFormatter } from "client/utils/timeFormatter";

export const EventLog = (): ReactElement => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const eventLogItems = useAppSelector((state) => state.login.eventLogItems);
  const games = useAppSelector((state) => state.allGames.games);
  const username = useAppSelector((state) => state.login.username);

  window.onbeforeunload = () => {
    setEventsSeen();
  };

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
    return () => {
      setEventsSeen();
    };
  }, [setEventsSeen]);

  const getTime = (createdAt: string): string => {
    const timeNow = dayjs();
    const isSameDay = timeNow.isSame(dayjs(createdAt), "day");
    if (!isSameDay) {
      return timeFormatter.getWeekdayAndTime({ time: createdAt });
    }
    return dayjs().to(createdAt);
  };

  return (
    <div>
      <EventLogItems>
        <h3>{t("eventLog.title")}</h3>
        {_.orderBy(eventLogItems, (item) => item.createdAt, "desc").map(
          (eventLogItem) => {
            const foundGame = games.find(
              (game) => game.gameId === eventLogItem.programItemId
            );
            if (!foundGame) return;
            return (
              <EventLogItem
                key={`${eventLogItem.action}-${eventLogItem.createdAt}`}
              >
                <EventMessage isSeen={eventLogItem.isSeen}>
                  <EventTitle>
                    {t(`eventLogActions.${eventLogItem.action}`)}:
                  </EventTitle>

                  <Link to={`/games/${eventLogItem.programItemId}`}>
                    {foundGame.title}
                  </Link>

                  <StartTime>
                    (
                    {timeFormatter.getWeekdayAndTime({
                      time: foundGame.startTime,
                    })}
                    )
                  </StartTime>
                </EventMessage>

                <span>
                  {t("eventLog.sentTimeAgo")} {getTime(eventLogItem.createdAt)}
                </span>
              </EventLogItem>
            );
          }
        )}
      </EventLogItems>
    </div>
  );
};

const EventLogItems = styled.div`
  padding: 8px;
`;

const EventLogItem = styled.div`
  display: flex;
  justify-content: space-between;
`;

const EventMessage = styled.span<{ isSeen: boolean }>`
  color: ${(props) => (props.isSeen ? "gray" : "black")};
`;

const EventTitle = styled.span`
  margin-right: 6px;
`;

const StartTime = styled.span`
  margin-left: 6px;
`;
