import { ReactElement } from "react";
import Instructions from "client/markdown/KonstiInstructions.mdx";
import { config } from "shared/config";

export const InstructionsView = (): ReactElement => {
  return (
    <Instructions
      conventionName={config.event().conventionName}
      conventionYear={config.event().conventionYear}
    />
  );
};
