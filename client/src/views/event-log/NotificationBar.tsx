import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router";
import styled from "styled-components";
import { config } from "shared/config";
import { AboutTab } from "client/app/AppRoutes";
import { DismissibleBanner } from "client/components/DismissibleBanner";
import { HighlightStyle, RaisedCard } from "client/components/RaisedCard";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { EventLogEventMessage } from "client/views/event-log/EventLogEventMessage";
import { submitUpdateEventLogIsSeen } from "client/views/login/loginThunks";

export const NotificationBar = (): ReactElement | null => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const location = useLocation();

  const programItems = useAppSelector(
    (state) => state.allProgramItems.programItems,
  );
  const eventLogItems = useAppSelector((state) => state.login.eventLogItems);
  const unseenEvents = eventLogItems.filter((item) => !item.isSeen);

  const notificationList = unseenEvents.map((unseenEvent) => {
    return (
      <DismissibleBanner
        key={`${unseenEvent.action}-${unseenEvent.createdAt}`}
        data-testid="notification-bar"
        icon="bell"
        highlightStyle={HighlightStyle.INFO}
        dismissAriaLabel={t("iconAltText.closeNotification")}
        onDismiss={() => {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          dispatch(
            submitUpdateEventLogIsSeen({
              eventLogItemId: unseenEvent.eventLogItemId,
              isSeen: true,
            }),
          );
        }}
      >
        <div>
          <EventLogEventMessage
            eventLogItem={unseenEvent}
            programItems={programItems}
            showDetails={false}
          />
          <ShowAllLinkContainer>
            <Link to={"/notifications"}>{t("notificationBar.showAll")}</Link>
          </ShowAllLinkContainer>
        </div>
      </DismissibleBanner>
    );
  });

  if (config.client().showAboutPageInProgress) {
    if (Object.values(AboutTab).includes(location.pathname as AboutTab)) {
      // Nothing to dismiss here, so it renders as a plain notice card
      notificationList.push(
        <InProgressNotice
          key="about-in-progress"
          isHighlighted={true}
          highlightStyle={HighlightStyle.INFO}
        >
          {t("aboutView.inProgress")}
        </InProgressNotice>,
      );
    }
  }

  if (notificationList.length === 0) {
    return null;
  }

  return <div>{notificationList}</div>;
};

const InProgressNotice = styled(RaisedCard)`
  margin: 4px 0;
  padding: 10px;
`;

const ShowAllLinkContainer = styled.div`
  margin: 20px 0 0 0;
`;
