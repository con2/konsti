import { api } from "client/utils/api";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { EmailNotificationTrigger } from "shared/types/emailNotification";

export const getSentryTest = async (): Promise<void> => {
  await api.get(ApiEndpoint.SENTRY_TEST);
};

export const postEmailTest = async (
  email: string,
  notificationType: EmailNotificationTrigger,
  programId: string,
): Promise<{ status: "error" | "success"; message: string }> => {
  try {
    await api.post(ApiEndpoint.EMAIL_TEST, {
      email,
      notificationType,
      programId,
    });
    return { status: "success", message: "Test email sent successfully" };
  } catch (error) {
    return {
      status: "error",
      message: `Failed to send test email: ${String(error)}`,
    };
  }
};
