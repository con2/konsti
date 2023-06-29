import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import instructionsFi from "client/markdown/KonstiInstructionsFi.md";
import instructionsEn from "client/markdown/KonstiInstructionsEn.md";

export const InstructionsView = (): ReactElement => {
  const { i18n } = useTranslation();

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {i18n.language === "fi" ? instructionsFi : instructionsEn}
    </ReactMarkdown>
  );
};
