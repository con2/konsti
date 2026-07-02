import { ReactElement, useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Checkbox } from "client/components/Checkbox";
import { Option } from "client/components/Dropdown";

interface Props {
  id?: string;
  options: Option[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  onClear: () => void;
  placeholder: string;
  className?: string;
}

export const MultiSelectDropdown = ({
  id,
  options,
  selectedValues,
  onToggle,
  onClear,
  placeholder,
  className,
}: Props): ReactElement => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const panelId = `${id ?? generatedId}-panel`;

  const selectedOptions = options.filter((option) =>
    selectedValues.includes(option.value),
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    const handlePointerDown = (event: MouseEvent): void => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <Container ref={containerRef} className={className}>
      {/* Pills hold their own remove buttons, so the dropdown toggle is a
          sibling button instead of wrapping the whole control (nested buttons
          are invalid HTML) */}
      <Control data-testid="tag-filter">
        {selectedOptions.map((option) => (
          <TagPill key={option.value}>
            {option.title}
            <RemoveButton
              type="button"
              aria-label={t("iconAltText.removeTag", { TAG: option.title })}
              onClick={() => {
                onToggle(option.value);
              }}
            >
              <FontAwesomeIcon icon="xmark" />
            </RemoveButton>
          </TagPill>
        ))}
        <ToggleButton
          type="button"
          id={id}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => {
            setOpen((prev) => !prev);
          }}
        >
          {selectedOptions.length === 0 && (
            <Placeholder>{placeholder}</Placeholder>
          )}
          <CaretIcon icon={open ? "chevron-up" : "chevron-down"} />
        </ToggleButton>
      </Control>
      {open && (
        <Panel id={panelId} role="group">
          {selectedValues.length > 0 && (
            <ClearButton type="button" onClick={onClear}>
              {t("clearSelection")}
            </ClearButton>
          )}
          {options.map((option) => (
            <Checkbox
              key={option.value}
              id={`${panelId}-${option.value}`}
              label={option.title}
              checked={selectedValues.includes(option.value)}
              onChange={() => {
                onToggle(option.value);
              }}
            />
          ))}
        </Panel>
      )}
    </Container>
  );
};

const Container = styled.div`
  position: relative;
`;

const Control = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  box-sizing: border-box;

  /* Keep in sync with the program type dropdown next to this in
     SearchAndFilterCard so the two filter controls line up */
  min-height: 38px;
  border: 1px solid ${(props) => props.theme.borderInactive};
  border-radius: 6px;
  padding: 2px 6px;
  background-color: ${(props) => props.theme.backgroundMain};
`;

const TagPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background-color: ${(props) => props.theme.backgroundTag};
  border-radius: 100px;
  padding: 4px 8px;
  font-size: ${(props) => props.theme.fontSizeSmaller};
  color: ${(props) => props.theme.textTag};
  white-space: nowrap;
`;

const RemoveButton = styled.button`
  display: inline-flex;
  align-items: center;
  padding: 0;
  border: none;
  background: none;
  color: ${(props) => props.theme.textTag};
  cursor: pointer;
`;

const ToggleButton = styled.button`
  display: flex;
  flex: 1;
  align-items: center;
  align-self: stretch;
  padding: 0;
  border: none;
  background: none;
  font-size: ${(props) => props.theme.fontSizeNormal};
  color: ${(props) => props.theme.textMain};
  cursor: pointer;
  text-align: left;
`;

const Placeholder = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CaretIcon = styled(FontAwesomeIcon)`
  margin: 0 0 0 auto;

  /* Match the size of the native select's arrow in the dropdown next to this */
  font-size: 12px;
`;

const Panel = styled.div`
  position: absolute;

  /* Above the program list's sticky timeslot headers (z-index: 2) */
  z-index: 3;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid ${(props) => props.theme.borderInactive};
  border-radius: 6px;
  background-color: ${(props) => props.theme.backgroundMain};
  box-shadow: ${(props) => props.theme.shadowLower};
`;

const ClearButton = styled.button`
  align-self: flex-start;
  padding: 0;
  border: none;
  background: none;
  color: ${(props) => props.theme.textLink};
  font-size: ${(props) => props.theme.fontSizeSmall};
  cursor: pointer;
  text-decoration: underline;
`;
