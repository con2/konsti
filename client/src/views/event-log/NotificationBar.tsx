import { ReactElement } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { HEADER_HEIGHT } from "client/components/Header";
import { submitUpdateEventLogIsSeen } from "client/views/login/loginThunks";
import { EventLogAction } from "shared/types/models/eventLog";
import { EventLogNewAssignment } from "client/views/event-log/EventLogNewAssignment";
import { EventLogNoAssignment } from "client/views/event-log/EventLogNoAssignment";

export const NotificationBar = (): ReactElement | null => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const username = useAppSelector((state) => state.login.username);
  const programItems = useAppSelector(
    (state) => state.allProgramItems.programItems,
  );
  const eventLogItems = useAppSelector((state) => state.login.eventLogItems);
  const unseenEvents = eventLogItems.filter((item) => !item.isSeen);

  const errorList = unseenEvents.map((unseenEvent) => {
    return (
      <StyledNotification
        key={`${unseenEvent.action}-${unseenEvent.createdAt}`}
      >
        <div>
          {unseenEvent.action === EventLogAction.NEW_ASSIGNMENT && (
            <EventLogNewAssignment
              eventLogItem={unseenEvent}
              programItems={programItems}
              showDetails={false}
            />
          )}

          {unseenEvent.action === EventLogAction.NO_ASSIGNMENT && (
            <EventLogNoAssignment eventLogItem={unseenEvent} />
          )}
          <ShowAllLinkContainer>
            <Link to={`/notifications`}>{t("notificationBar.showAll")}</Link>
          </ShowAllLinkContainer>
        </div>

        <span>
          <StyledFontAwesomeIcon
            icon="xmark"
            aria-label={t("iconAltText.closeNotification")}
            onClick={() => {
              // eslint-disable-next-line @typescript-eslint/no-floating-promises
              dispatch(
                submitUpdateEventLogIsSeen({
                  username,
                  eventLogItemId: unseenEvent.eventLogItemId,
                  isSeen: true,
                }),
              );
            }}
          />
        </span>
      </StyledNotification>
    );
  });

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

const ShowAllLinkContainer = styled.div`
  margin: 20px 0 0 0;
`;

const StyledFontAwesomeIcon = styled(FontAwesomeIcon)`
  cursor: pointer;
`;
