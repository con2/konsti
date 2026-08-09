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

const { appBuildTime } = config.client();

// Empty when a build carried no timestamp, and any non-numeric value is
// treated the same way: without a usable time there is nothing to order by
const parseBuildTime = (value: string): number | null => {
  const parsed = Number(value);
  return value === "" || Number.isNaN(parsed) ? null : parsed;
};

const ownBuildTime = parseBuildTime(appBuildTime);

// Shown when the version the server reports differs from the version baked
// into this bundle, i.e. a new Konsti version was deployed after this page
// was loaded. Reloading fetches the current version
export const AppUpdateBanner = (): ReactElement | null => {
  const { t } = useTranslation();

  const serverAppVersion = useAppSelector(
    (state) => state.admin.serverAppVersion,
  );
  const serverAppBuildTime = useAppSelector(
    (state) => state.admin.serverAppBuildTime,
  );
  // Keyed to the dismissed version so a later deploy notifies again
  const [dismissedVersion, setDismissedVersion] = useState<string>("");

  const routerLocation = useLocation();
  const lastLocationKey = useRef(routerLocation.key);

  // Strictly newer, not merely different. Images are built in the order they
  // are deployed, so this distinguishes a server that has moved on from one
  // that simply hasn't rolled yet: mid-rollout a page served by an
  // already-updated instance keeps polling instances still on the old build,
  // and must not be told to update to the version it is already running.
  // Either side missing a build time means there is nothing to compare, which
  // is the case in every environment that doesn't stamp its builds
  const serverBuildTime = parseBuildTime(serverAppBuildTime);
  const updateAvailable =
    ownBuildTime !== null &&
    serverBuildTime !== null &&
    serverBuildTime > ownBuildTime;

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
