import { ReactElement, ReactNode, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { partition } from "lodash-es";
import { ExpandButton } from "client/components/ExpandButton";
import { RaisedCard } from "client/components/RaisedCard";

interface Props {
  children: ReactNode;
}

// eslint-disable-next-line import/no-unused-modules
export const Expand = ({ children }: Props): ReactElement | null => {
  const { t, i18n } = useTranslation();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  if (!children || !Array.isArray(children)) {
    return null;
  }

  const headerElements = ["h2", "h3"];

  const [headers, elements] = partition(children, (child) =>
    headerElements.includes(child.props.children.type as string),
  );

  const header = i18n.language === "fi" ? headers[0] : headers[1];
  const headerText = header.props.children.props.children;

  return (
    <div>
      <ExpandButton
        isExpanded={isExpanded}
        showMoreText={header}
        showLessText={header}
        showMoreAriaLabel={`${t("aboutView.showMore")} ${headerText}`}
        showLessAriaLabel={`${t("aboutView.showLess")} ${headerText}`}
        ariaControls={`more-info-${headerText}`}
        onClick={() => setIsExpanded(!isExpanded)}
      />

      {isExpanded && <StyledRaisedCard>{elements}</StyledRaisedCard>}
    </div>
  );
};

const StyledRaisedCard = styled(RaisedCard)`
  margin: 0;
`;
