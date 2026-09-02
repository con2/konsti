import { ReactElement } from "react";
import { PrivacyNoticeText } from "client/components/PrivacyNoticeText";
import { ScrollToTopButton } from "client/components/ScrollToTopButton";

// Not lazy loaded like the other About tabs: the notice text below already
// loads its own chunk
export const PrivacyNoticeView = (): ReactElement => {
  return (
    <>
      <PrivacyNoticeText />
      <ScrollToTopButton />
    </>
  );
};
