import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "react-router-dom";
import instructionsFi from "client/markdown/KonstiInstructionsFi.md";
import instructionsEn from "client/markdown/KonstiInstructionsEn.md";

export const InstructionsView = (): ReactElement => {
  const { i18n } = useTranslation();

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: (props) =>
          /* eslint-disable react/prop-types */
          props.href?.startsWith("/") ? (
            <Link to={props.href ?? "/about"}>{props.children}</Link>
          ) : (
            <a href={props.href}>{props.children}</a>
          ),
        /* eslint-enable react/prop-types */
      }}
    >
      {i18n.language === "fi" ? instructionsFi : instructionsEn}
    </ReactMarkdown>
  );
};
