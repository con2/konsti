import { ReactElement } from "react";
import { config } from "shared/config";
import { ScrollToTopButton } from "client/components/ScrollToTopButton";
import Instructions from "client/markdown/KonstiInstructions.mdx";

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
