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
              <div key={`${eventLogItem.action}-${eventLogItem.createdAt}`}>
                <EventTitle isSeen={eventLogItem.isSeen}>
                  {t(`eventLogActions.${eventLogItem.action}`)}:{" "}
                  <Link to={`/games/${eventLogItem.programItemId}`}>
                    {foundGame.title}
                  </Link>{" "}
                  {timeFormatter.getWeekdayAndTime({
                    time: foundGame.startTime,
                  })}{" "}
                  ({t("eventLog.sentTimeAgo")} {getTime(eventLogItem.createdAt)}
                  )
                </EventTitle>
              </div>
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

const EventTitle = styled.span<{ isSeen: boolean }>`
  color: ${(props) => (props.isSeen ? "gray" : "black")};
`;
