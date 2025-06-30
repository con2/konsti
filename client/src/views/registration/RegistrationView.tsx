import { ReactElement } from "react";
import { KonstiRegistrationPage } from "client/views/registration/components/KonstiRegistrationPage";
import { LoginProvider } from "shared/config/eventConfigTypes";
import { useAppSelector } from "client/utils/hooks";
import { KonstiAndKompassiRegistrationPage } from "client/views/registration/components/KonstiAndKompassiRegistrationPage";

export const RegistrationView = (): ReactElement | null => {
  const loginProvider = useAppSelector((state) => state.admin.loginProvider);

  if (loginProvider == LoginProvider.LOCAL) {
    return <KonstiRegistrationPage />;
  } else if (loginProvider == LoginProvider.LOCAL_KOMPASSI) {
    return <KonstiAndKompassiRegistrationPage />;
  }
  // No separate page for Kompassi-only case, registration happens in Kompassi.
  return null;
};
