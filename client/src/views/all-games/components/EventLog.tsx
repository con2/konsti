import { ReactElement, useCallback, useEffect, useRef } from "react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { orderBy } from "lodash-es";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { submitUpdateEventLogIsSeen } from "client/views/login/loginThunks";
import { getWeekdayAndTime } from "client/utils/timeFormatter";
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
        const foundGame = games.find(
          (game) => game.gameId === eventLogItem.programItemId,
        );
        if (!foundGame) {
          return;
        }
        return (
          <RaisedCard
            isHighlighted={!eventLogItem.isSeen}
            key={eventLogItem.eventLogItemId}
          >
            <span>
              {t(`eventLogActions.${eventLogItem.action}`)}
              <StyledLink to={`/games/${eventLogItem.programItemId}`}>
                {foundGame.title}
              </StyledLink>
              .
            </span>

            <StartTime>
              {t("eventLog.programItemDetails", {
                START_TIME: getWeekdayAndTime(foundGame.startTime),
                LOCATION: foundGame.location,
              })}
            </StartTime>

            <MessageCreatedAt>
              <span>{getTime(eventLogItem.createdAt)}</span>
            </MessageCreatedAt>
          </RaisedCard>
        );
      })}
    </div>
  );
};

const StartTime = styled.div`
  margin: 8px 0 0 0;
`;

const MessageCreatedAt = styled.div`
  display: flex;
  justify-content: right;
  margin: 8px 4px -4px 0;
  color: ${(props) => props.theme.textSecondary};
`;

const StyledLink = styled(Link)`
  margin: 8px 0 0 0;
`;

const Title = styled.h1`
  font-size: ${(props) => props.theme.mainHeaderFontSize};
`;
