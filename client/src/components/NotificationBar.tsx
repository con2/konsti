import { ReactElement } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { HEADER_HEIGHT } from "client/components/Header";
import { getWeekdayAndTime } from "client/utils/timeFormatter";
import { submitUpdateEventLogIsSeen } from "client/views/login/loginThunks";
import { AppRoute } from "client/app/AppRoutes";

export const NotificationBar = (): ReactElement | null => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const username = useAppSelector((state) => state.login.username);
  const programItems = useAppSelector(
    (state) => state.allProgramItems.programItems,
  );
  const eventLogItems = useAppSelector((state) => state.login.eventLogItems);
  const unseenEvents = eventLogItems.filter((item) => !item.isSeen);

  const errorList = unseenEvents.map(
    ({ eventLogItemId, programItemId, action, createdAt }) => {
      const foundProgramItem = programItems.find(
        (programItem) => programItem.programItemId === programItemId,
      );
      if (!foundProgramItem) {
        return;
      }
      return (
        <StyledNotification key={`${action}-${createdAt}`}>
          <div>
            <span>
              {t(`eventLogActions.${action}`, {
                PROGRAM_TYPE: t(
                  `programTypeIllative.${foundProgramItem.programType}`,
                ),
              })}{" "}
            </span>
            <Link to={`${AppRoute.PROGRAM_ITEM}/${programItemId}`}>
              {foundProgramItem.title}
            </Link>
            <StartTime>
              ({getWeekdayAndTime(foundProgramItem.startTime)})
            </StartTime>
            .
            <ShowAllLinkContainer>
              <Link to={`/notifications`}>{t("notificationBar.showAll")}</Link>
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
                  }),
                );
              }}
            />
          </span>
        </StyledNotification>
      );
    },
  );

  return <NotificationContainer>{errorList}</NotificationContainer>;
};

const StyledNotification = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background-color: ${(props) => props.theme.backgroundBody};
  color: ${(props) => props.theme.textMain};
  border-radius: 4px;
  margin: 4px 2px;
  border: 1px solid ${(props) => props.theme.borderCardHighlight};
  border-left: 5px solid ${(props) => props.theme.borderCardHighlight};
  box-shadow: ${(props) => props.theme.shadowHigher};
`;

const NotificationContainer = styled.div`
  position: sticky;
  top: ${HEADER_HEIGHT}px;
  z-index: 10;
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
