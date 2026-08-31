import { ReactElement, ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { partition } from "remeda";
import styled from "styled-components";
import { ExpandButton } from "client/components/ExpandButton";
import { RaisedCard } from "client/components/RaisedCard";

interface Props {
  children: ReactNode;
}

export const Expand = ({ children }: Props): ReactElement | null => {
  const { t, i18n } = useTranslation();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  if (!children || !Array.isArray(children)) {
    return null;
  }

  const headerElements = new Set(["h3"]);

  const [headers, elements] = partition(children, (child) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    headerElements.has(child.props.children?.type as string),
  );

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const header = i18n.language === "fi" ? headers[0] : headers[1];
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const headerText = header.props.children.props.children;

  return (
    <Container>
      <ExpandButton
        isExpanded={isExpanded}
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        showMoreText={header}
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        showLessText={header}
        showMoreAriaLabel={`${t("aboutView.showMore")} ${headerText}`}
        showLessAriaLabel={`${t("aboutView.showLess")} ${headerText}`}
        ariaControls={`more-info-${headerText}`}
        onClick={() => setIsExpanded(!isExpanded)}
      />

      {isExpanded && <StyledRaisedCard>{elements}</StyledRaisedCard>}
    </Container>
  );
};

const Container = styled.div`
  h3 {
    margin: 12px 0 12px 0;
  }

  span {
    text-decoration: none;
  }
`;

const StyledRaisedCard = styled(RaisedCard)`
  margin: 0;

  /* The content is Markdown, so the leading and trailing elements vary and have
     no component of their own to carry a margin */
  > :first-child {
    margin-top: 0;
  }

  > :last-child {
    margin-bottom: 0;
  }
`;
