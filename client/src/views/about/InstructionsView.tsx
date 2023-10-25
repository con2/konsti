import { ReactElement } from "react";
import Instructions from "client/markdown/KonstiInstructions.mdx";
import { getSharedConfig } from "shared/config/sharedConfig";

export const InstructionsView = (): ReactElement => {
  return (
    <Instructions
      conventionName={getSharedConfig().CONVENTION_NAME}
      conventionYear={getSharedConfig().CONVENTION_YEAR}
    />
  );
};
