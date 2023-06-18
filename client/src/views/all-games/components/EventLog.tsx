import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { FavoriteButton } from "client/components/FavoriteButton";
import { submitUpdateEventLogIsSeen } from "client/views/login/loginThunks";

export const EventLog = (): ReactElement => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const eventLogItems = useAppSelector((state) => state.login.eventLogItems);
  const username = useAppSelector((state) => state.login.username);
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
                </Link>
              </EventTitle>
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
