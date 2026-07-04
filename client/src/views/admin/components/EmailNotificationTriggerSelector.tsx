import { ReactElement, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { EmailNotificationTrigger } from "shared/types/emailNotification";
import { Checkbox } from "client/components/Checkbox";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { submitSetEmailNotificationTriggers } from "client/views/admin/adminThunks";

export const EmailNotificationTriggerSelector = (): ReactElement => {
  const emailNotificationTrigger = useAppSelector(
    (state) => state.admin.emailNotificationTrigger,
  );
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState<boolean>(false);

  const toggleTrigger = async (
    trigger: EmailNotificationTrigger,
  ): Promise<void> => {
    const nextTriggers = emailNotificationTrigger.includes(trigger)
      ? emailNotificationTrigger.filter((value) => value !== trigger)
      : [...emailNotificationTrigger, trigger];

    setLoading(true);
    await dispatch(submitSetEmailNotificationTriggers(nextTriggers));
    setLoading(false);
  };

  return (
    <div>
      <TriggerList>
        {Object.entries(EmailNotificationTrigger).map(([name, trigger]) => {
          const readableName = t(`admin.emailNotificationTrigger.${trigger}`);
          return (
            <Checkbox
              key={trigger}
              id={`email-notification-trigger-${trigger}`}
              label={`${readableName} (${name})`}
              checked={emailNotificationTrigger.includes(trigger)}
              disabled={loading}
              onChange={() => {
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                toggleTrigger(trigger);
              }}
            />
          );
        })}
      </TriggerList>
    </div>
  );
};

const TriggerList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
`;
