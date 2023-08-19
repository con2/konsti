import { ReactElement, ReactNode } from "react";
import styled from "styled-components";

export enum HighlightStyle {
  INFO = "info",
  WARN = "warn",
}

interface Props {
  children: ReactNode;
  className?: string;
  "data-testid"?: string;
  isHighlighted?: boolean;
  highlightStyle?: HighlightStyle;
}

export const RaisedCard = ({
  children,
  className,
  "data-testid": dataTestId,
  isHighlighted = false,
  highlightStyle,
}: Props): ReactElement => (
  <Card
    className={className}
    data-testid={dataTestId}
    $isHighlighted={isHighlighted}
    highlightStyle={highlightStyle}
  >
    {children}
  </Card>
);

const Card = styled.div<{
  $isHighlighted: boolean;
  highlightStyle?: HighlightStyle;
}>`
  margin: 20px 0 20px 0;
  padding: 16px 8px 16px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fafafa;
  box-shadow: ${(props) => props.theme.shadowLower};

  ${(props) =>
    props.$isHighlighted &&
    `border: 1px solid ${
      props.highlightStyle === HighlightStyle.WARN
        ? props.theme.borderCardWarnHighlight
        : props.theme.borderCardHighlight
    };`}
  ${(props) =>
    props.$isHighlighted &&
    `border-left: 5px solid ${
      props.highlightStyle === HighlightStyle.WARN
        ? props.theme.borderCardWarnHighlight
        : props.theme.borderCardHighlight
    };`}
`;
