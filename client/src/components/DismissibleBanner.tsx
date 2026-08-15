import { IconName } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ReactElement, ReactNode } from "react";
import styled from "styled-components";
import {
  HighlightStyle,
  RaisedCard,
  getHighlightColor,
} from "client/components/RaisedCard";

interface Props {
  children: ReactNode;
  onDismiss: () => void;
  dismissAriaLabel: string;
  icon: IconName;
  highlightStyle: HighlightStyle;
  "data-testid"?: string;
}

// Shared shell for app-level notification banners: a leading icon, the
// message, and a dismiss button on the right. Built on the same highlighted
// card the app uses for its other notices so the banners read as part of the
// same system. Stickiness comes from the wrapper the app-level bars render in
export const DismissibleBanner = ({
  children,
  onDismiss,
  dismissAriaLabel,
  icon,
  highlightStyle,
  "data-testid": dataTestId,
}: Props): ReactElement => {
  return (
    <Banner
      isHighlighted={true}
      highlightStyle={highlightStyle}
      data-testid={dataTestId}
    >
      <BannerIcon
        icon={icon}
        $highlightStyle={highlightStyle}
        aria-hidden={true}
      />
      <Content>{children}</Content>
      <CloseButton
        type="button"
        onClick={onDismiss}
        aria-label={dismissAriaLabel}
      >
        <FontAwesomeIcon icon="xmark" />
      </CloseButton>
    </Banner>
  );
};

const Banner = styled(RaisedCard)`
  display: flex;
  align-items: center;
  gap: 12px;

  /* Same box metrics as the other app-level bars so their dismiss icons
     line up when several are stacked */
  margin: 4px 0;
  padding: 10px;
`;

const BannerIcon = styled(FontAwesomeIcon)<{
  $highlightStyle: HighlightStyle;
}>`
  flex-shrink: 0;
  font-size: 20px;
  color: ${(props) => getHighlightColor(props.theme, props.$highlightStyle)};
`;

// Lays out the message and any action the banner offers, wrapping onto a
// second row on narrow screens instead of squeezing the text
const Content = styled.div`
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
`;

const CloseButton = styled.button`
  flex-shrink: 0;

  /* Centers the glyph in the button box: as inline content it would sit off
     centre by the font's descender, which shows next to a taller message */
  display: flex;
  align-items: center;

  border: none;
  background: none;
  padding: 0;
  font-size: 18px;
  cursor: pointer;
  color: ${(props) => props.theme.textLighter};

  &:hover,
  &:focus {
    color: ${(props) => props.theme.textMain};
  }
`;
