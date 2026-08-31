import { ReactElement, Suspense } from "react";
import { Loading } from "client/components/Loading";
import { lazyWithRetry } from "client/utils/lazyWithRetry";

// Only mounted once a collapsed container is opened, so the notice text is
// fetched when someone asks to read it rather than on every load
const PrivacyNoticeMarkdown = lazyWithRetry(
  "PrivacyNotice",
  async () => await import("client/markdown/PrivacyNotice.mdx"),
);

export const PrivacyNoticeText = (): ReactElement => (
  <Suspense fallback={<Loading />}>
    <PrivacyNoticeMarkdown />
  </Suspense>
);
