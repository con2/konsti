import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "react-router-dom";
import konstiFaqFi from "client/markdown/KonstiFaqFi.md";
import konstiFaqEn from "client/markdown/KonstiFaqEn.md";

export const FaqView = (): ReactElement => {
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
      {i18n.language === "fi" ? konstiFaqFi : konstiFaqEn}
    </ReactMarkdown>
  );
};
