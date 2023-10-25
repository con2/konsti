import { ReactElement } from "react";
import Instructions from "client/markdown/KonstiInstructions.mdx";
import { config } from "shared/config";

export const InstructionsView = (): ReactElement => {
  return (
    <Instructions
      conventionName={config.shared().CONVENTION_NAME}
      conventionYear={config.shared().CONVENTION_YEAR}
    />
  );
};
