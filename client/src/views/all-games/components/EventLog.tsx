import { ReactElement } from "react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { useAppSelector } from "client/utils/hooks";

export const EventLog = (): ReactElement => {
  const { t } = useTranslation();

  const eventLogItems = useAppSelector((state) => state.login.eventLogItems);
  const games = useAppSelector((state) => state.allGames.games);

  return (
    <div>
      <EventLogItems>
        <h3>{t("eventLog.title")}</h3>
        {eventLogItems.map((eventLogItem) => {
          const foundGame = games.find(
            (game) => game.gameId === eventLogItem.programItemId
          );
          if (!foundGame) return;
          return (
            <div key={eventLogItem.action}>
              <EventTitle isSeen={eventLogItem.isSeen}>
                {t(`eventLogActions.${eventLogItem.action}`)}:{" "}
                <Link to={`/games/${eventLogItem.programItemId}`}>
                  {foundGame.title}
                </Link>{" "}
                ({t("eventLog.sentTimeAgo")}{" "}
                {dayjs().to(eventLogItem.createdAt)})
              </EventTitle>
              {/*
              <FavoriteButton
                isFavorite={eventLogItem.isSeen}
                onClick={async () => {
                  await dispatch(
                    submitUpdateEventLogIsSeen({
                      username,
                      eventLogItemId: eventLogItem.eventLogItemId,
                      isSeen: !eventLogItem.isSeen,
                    })
                  );
                }}
              />
              */}
            </div>
          );
        })}
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
