import { ReactElement, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "client/utils/hooks";
import { config } from "shared/config";
import { Button, ButtonStyle } from "client/components/Button";
import { DismissibleBanner } from "client/components/DismissibleBanner";
import { HighlightStyle } from "client/components/RaisedCard";
import {
  getAppUpdateReloadedVersion,
  saveAppUpdateReloadedVersion,
} from "client/utils/sessionStorage";

const { appVersion } = config.client();

// Shown when the version the server reports differs from the version baked
// into this bundle, i.e. a new Konsti version was deployed after this page
// was loaded. Reloading fetches the current version
export const AppUpdateBanner = (): ReactElement | null => {
  const { t } = useTranslation();

  const serverAppVersion = useAppSelector(
    (state) => state.admin.serverAppVersion,
  );
  // Keyed to the dismissed version so a later deploy notifies again
  const [dismissedVersion, setDismissedVersion] = useState<string>("");

  const routerLocation = useLocation();
  const lastLocationKey = useRef(routerLocation.key);

  // Both versions must be known: environments where either side has no
  // release version never trigger the notification. Truthiness rather than a
  // comparison to "": a server old enough to omit the field from its response
  // reports undefined, which must count as unknown too.
  // The versions are build SHAs, which carry no ordering, so "differs" is all
  // that can be checked: mid-rollout a page served by an already-updated
  // instance can poll one that hasn't rolled yet and notify about a version
  // it is already running. That resolves itself once the rollout completes
  const updateAvailable =
    Boolean(appVersion) &&
    Boolean(serverAppVersion) &&
    serverAppVersion !== appVersion;

  const dismissed = dismissedVersion === serverAppVersion;

  // Reload transparently on the first route navigation after an update is
  // detected: a navigation replaces the whole view anyway, so a full page
  // load is not disruptive there. Only an actual navigation may trigger the
  // reload - never the update detection itself, which can happen mid-view.
  // Attempt it only once per server version so a reload that fails to
  // deliver the new version can't loop; after that the banner's reload
  // button remains as the manual path
  useEffect(() => {
    const isNavigation = routerLocation.key !== lastLocationKey.current;
    lastLocationKey.current = routerLocation.key;
    if (
      !isNavigation ||
      !updateAvailable ||
      dismissed ||
      getAppUpdateReloadedVersion() === serverAppVersion
    ) {
      return;
    }
    saveAppUpdateReloadedVersion(serverAppVersion);
    location.reload();
  }, [routerLocation.key, updateAvailable, dismissed, serverAppVersion]);

  if (!updateAvailable || dismissed) {
    return null;
  }

  return (
    <DismissibleBanner
      data-testid="app-update-banner"
      icon="arrows-rotate"
      highlightStyle={HighlightStyle.INFO}
      onDismiss={() => {
        setDismissedVersion(serverAppVersion);
      }}
      dismissAriaLabel={t("iconAltText.closeAppUpdateNotification")}
    >
      <Message>{t("appUpdateBanner.message")}</Message>
      <Button
        buttonStyle={ButtonStyle.PRIMARY}
        onClick={() => {
          location.reload();
        }}
      >
        {t("appUpdateBanner.reload")}
      </Button>
    </DismissibleBanner>
  );
};

const Message = styled.span`
  flex: 1;
`;
