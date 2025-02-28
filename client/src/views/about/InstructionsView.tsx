import { ReactElement } from "react";
import Instructions from "client/markdown/KonstiInstructions.mdx";
import { config } from "shared/config";
import { ScrollToTopButton } from "client/components/ScrollToTopButton";

export const InstructionsView = (): ReactElement => {
  return (
    <>
      <Instructions
        eventName={config.event().eventName}
        eventYear={config.event().eventYear}
      />
      <ScrollToTopButton />
    </>
  );
};
