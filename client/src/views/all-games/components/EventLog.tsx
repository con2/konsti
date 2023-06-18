import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Accordion } from "client/components/Accordion";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { FavoriteButton } from "client/components/FavoriteButton";
import { submitUpdateEventLogIsSeen } from "client/views/login/loginThunks";

export const EventLog = (): ReactElement => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const eventLogItems = useAppSelector((state) => state.login.eventLogItems);
  const username = useAppSelector((state) => state.login.username);

  return (
    <div>
      <Accordion
        closeAccordionText={t("eventLog.title")}
        openAccordionText={t("eventLog.title")}
      >
        <EventLogItems>
          {eventLogItems.map((eventLogItem) => {
            return (
              <div key={eventLogItem.action}>
                <EventTitle isSeen={eventLogItem.isSeen}>
                  {t(`eventLogActions.${eventLogItem.action}`)}:{" "}
                  {eventLogItem.eventItemId}
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
      </Accordion>
    </div>
  );
};

const EventLogItems = styled.div`
  padding: 8px;
`;

const EventTitle = styled.span<{ isSeen: boolean }>`
  color: ${(props) => (props.isSeen ? "gray" : "black")};
`;
