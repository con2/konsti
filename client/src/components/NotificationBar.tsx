import { ReactElement } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { HEADER_HEIGHT } from "client/components/Header";
import { timeFormatter } from "client/utils/timeFormatter";
import { submitUpdateEventLogIsSeen } from "client/views/login/loginThunks";

export const NotificationBar = (): ReactElement | null => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const username = useAppSelector((state) => state.login.username);
  const games = useAppSelector((state) => state.allGames.games);
  const eventLogItems = useAppSelector((state) => state.login.eventLogItems);
  const unseenEvents = eventLogItems.filter((item) => !item.isSeen);

  const errorList = unseenEvents.map(
    ({ eventLogItemId, programItemId, action, createdAt }) => {
      const foundGame = games.find((game) => game.gameId === programItemId);
      if (!foundGame) return;
      return (
        <StyledNotification key={`${action}-${createdAt}`}>
          <div>
            <span>{t(`eventLogActions.${action}`)}</span>
            <StyledProgramLink to={`/games/${programItemId}`}>
              {foundGame.title}
            </StyledProgramLink>
            <StartTime>
              (
              {timeFormatter.getWeekdayAndTime({
                time: foundGame.startTime,
              })}
              )
            </StartTime>

            <ShowAllLinkContainer>
              <StyledLink to={`/notifications`}>
                {t("notificationBar.showAll")}
              </StyledLink>
            </ShowAllLinkContainer>
          </div>

          <span>
            <StyledFontAwesomeIcon
              icon="xmark"
              aria-label={t("iconAltText.closeNotification")}
              onClick={() => {
                dispatch(
                  submitUpdateEventLogIsSeen({
                    username,
                    eventLogItemId,
                    isSeen: true,
                  })
                );
              }}
            />
          </span>
        </StyledNotification>
      );
    }
  );

  return <NotificationContainer>{errorList}</NotificationContainer>;
};

const StyledNotification = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background-color: ${(props) => props.theme.backgroundNotificationBanner};
  color: ${(props) => props.theme.textMain};
  border: 1px solid ${(props) => props.theme.borderActive};
  border-radius: 4px;
  margin: 4px 2px;
`;

const NotificationContainer = styled.div`
  position: sticky;
  top: ${HEADER_HEIGHT}px;
  z-index: 10;
`;

const StyledLink = styled(Link)`
  color: ${(props) => props.theme.textMainLink};
`;

const StyledProgramLink = styled(StyledLink)`
  margin-left: 6px;
`;

const StartTime = styled.span`
  margin-left: 6px;
`;

const ShowAllLinkContainer = styled.div`
  margin: 20px 0 0 0;
`;

const StyledFontAwesomeIcon = styled(FontAwesomeIcon)`
  cursor: pointer;
`;
