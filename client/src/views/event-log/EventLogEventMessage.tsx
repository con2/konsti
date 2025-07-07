import { ReactElement } from "react";
import { EventLogNewAssignment } from "client/views/event-log/EventLogNewAssignment";
import { EventLogNoAssignment } from "client/views/event-log/EventLogNoAssignment";
import { EventLogAction, EventLogItem } from "shared/types/models/eventLog";
import { ProgramItem } from "shared/types/models/programItem";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";
import { EventLogProgramItemCanceled } from "client/views/event-log/EventLogProgramItemCanceled";

interface Props {
  eventLogItem: EventLogItem;
  programItems: readonly ProgramItem[];
}

export const EventLogEventMessage = ({
  eventLogItem,
  programItems,
}: Props): ReactElement => {
  switch (eventLogItem.action) {
    case EventLogAction.NEW_ASSIGNMENT:
      return (
        <EventLogNewAssignment
          eventLogItem={eventLogItem}
          programItems={programItems}
          showDetails={true}
        />
      );
    case EventLogAction.NO_ASSIGNMENT:
      return <EventLogNoAssignment eventLogItem={eventLogItem} />;
    case EventLogAction.PROGRAM_ITEM_CANCELED:
      return <EventLogProgramItemCanceled eventLogItem={eventLogItem} />;
    default:
      return exhaustiveSwitchGuard(eventLogItem.action);
  }
};
