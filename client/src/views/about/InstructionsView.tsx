import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import InstructionsFi from "client/markdown/KonstiInstructionsFi.mdx";
import InstructionsEn from "client/markdown/KonstiInstructionsEn.mdx";
import { sharedConfig } from "shared/config/sharedConfig";

export const InstructionsView = (): ReactElement => {
  const { i18n } = useTranslation();

  const props = {
    conventionName: sharedConfig.CONVENTION_NAME,
    conventionYear: sharedConfig.CONVENTION_YEAR,
  };

  return (
    <div>
      {i18n.language === "fi" ? (
        <InstructionsFi {...props} />
      ) : (
        <InstructionsEn {...props} />
      )}
    </div>
  );
};
