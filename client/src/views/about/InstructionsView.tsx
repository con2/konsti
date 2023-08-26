import { ReactElement } from "react";
import Instructions from "client/markdown/KonstiInstructions.mdx";
import { sharedConfig } from "shared/config/sharedConfig";

export const InstructionsView = (): ReactElement => {
  return (
    <Instructions
      conventionName={sharedConfig.CONVENTION_NAME}
      conventionYear={sharedConfig.CONVENTION_YEAR}
    />
  );
};
