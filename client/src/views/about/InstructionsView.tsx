import { ReactElement } from "react";
import Instructions from "client/markdown/KonstiInstructions.mdx";
import { config } from "shared/config";

export const InstructionsView = (): ReactElement => {
  return (
    <Instructions
      conventionName={config.shared().conventionName}
      conventionYear={config.shared().conventionYear}
    />
  );
};
