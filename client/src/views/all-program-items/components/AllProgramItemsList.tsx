import {
  ReactElement,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { sortBy, groupBy } from "remeda";
import styled from "styled-components";
import {
  defaultRangeExtractor,
  useWindowVirtualizer,
} from "@tanstack/react-virtual";
import { ProgramItemEntry } from "client/views/program-item/ProgramItemEntry";
import { useAppSelector } from "client/utils/hooks";
import {
  ProgramItem,
  ProgramItemSignupStrategy,
} from "shared/types/models/programItem";
import { ProgramItemListTitle } from "client/views/all-program-items/components/ProgramItemListTitle";
import { getActiveStickyHeaderIndex } from "client/views/all-program-items/programListUtils";
import { getLotterySignups } from "client/utils/getUpcomingProgramItems";
import {
  selectDirectSignups,
  selectLotterySignups,
} from "client/views/my-program-items/myProgramItemsSlice";
import { RaisedCard } from "client/components/RaisedCard";
import { getIsInGroup } from "client/views/group/groupUtils";
import { SignupQuestion } from "shared/types/models/settings";
import { selectGroupMembers } from "client/views/group/groupSlice";
import { config } from "shared/config";

interface Props {
  programItems: readonly ProgramItem[];
}

// The grouped list is flattened into a single sequence of rows (a start-time
// header followed by its program items) so it can be window-virtualized
type VirtualRow =
  | { kind: "header"; startTime: string }
  | { kind: "item"; programItem: ProgramItem };

// Initial row-height guesses; the virtualizer measures the real heights on mount
const HEADER_ESTIMATED_HEIGHT = 60;
const ITEM_ESTIMATED_HEIGHT = 220;

// The top visible row index when the list unmounts, so returning to it (e.g. via
// the browser back button after viewing a program item) restores the scroll
// position. Module-scoped so it survives navigation within the SPA session
let savedTopRowIndex: number | null = null;

export const AllProgramItemsList = ({ programItems }: Props): ReactElement => {
  const { t } = useTranslation();

  const signups = useAppSelector(
    (state) => state.allProgramItems.directSignups,
  );
  const lotterySignups = useAppSelector(selectLotterySignups);
  const directSignups = useAppSelector(selectDirectSignups);
  const activeProgramType = useAppSelector(
    (state) => state.admin.activeProgramType,
  );
  const groupMembers = useAppSelector(selectGroupMembers);
  const isGroupCreator = useAppSelector((state) => state.group.isGroupCreator);
  const groupCode = useAppSelector((state) => state.group.groupCode);
  const username = useAppSelector((state) => state.login.username);
  const loggedIn = useAppSelector((state) => state.login.loggedIn);
  const userGroup = useAppSelector((state) => state.login.userGroup);
  const isInGroup = getIsInGroup(groupCode);

  const signupQuestions = useAppSelector(
    (state) => state.admin.signupQuestions,
  );

  // Index signups by program item id so each row is an O(1) lookup instead of
  // scanning the full signups array (which made the list render O(n^2))
  const signupsByProgramItemId = new Map(
    signups.map((signup) => [signup.programItemId, signup.users]),
  );

  // Index the first public signup question per program item id
  const publicSignupQuestionByProgramItemId = new Map<string, SignupQuestion>();
  for (const signupQuestion of signupQuestions) {
    if (
      !signupQuestion.private &&
      !publicSignupQuestionByProgramItemId.has(signupQuestion.programItemId)
    ) {
      publicSignupQuestionByProgramItemId.set(
        signupQuestion.programItemId,
        signupQuestion,
      );
    }
  }

  const ownOrGroupCreatorLotterySignups = getLotterySignups({
    lotterySignups,
    isGroupCreator,
    groupMembers,
    isInGroup,
    showAllProgramItems: true,
  });

  // Flatten the grouped list once per program-item set (stable across scroll and
  // language changes so it stays out of the scroll render path)
  const { rows, stickyHeaderIndexes } = useMemo(() => {
    const sortedProgramItems = sortBy(
      programItems,
      (programItem) => programItem.startTime,
      (programItem) => programItem.title.toLowerCase(),
    );
    const programItemsByStartTime = groupBy(
      sortedProgramItems,
      (programItem) => programItem.startTime,
    );

    const nextRows: VirtualRow[] = [];
    const nextStickyHeaderIndexes: number[] = [];
    for (const [startTime, programItemsForStartTime] of Object.entries(
      programItemsByStartTime,
    )) {
      nextStickyHeaderIndexes.push(nextRows.length);
      nextRows.push({ kind: "header", startTime });
      for (const programItem of programItemsForStartTime) {
        nextRows.push({ kind: "item", programItem });
      }
    }
    return { rows: nextRows, stickyHeaderIndexes: nextStickyHeaderIndexes };
  }, [programItems]);

  // The page itself scrolls (no inner scroll container), so virtualize against
  // the window. scrollMargin is the list's offset from the top of the document
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);
  useLayoutEffect(() => {
    const element = listRef.current;
    if (!element) {
      return;
    }
    // Keep the list's document offset current: content above it (the filter
    // card) can change height, which would otherwise misalign every row
    const updateScrollMargin = (): void => {
      const nextScrollMargin =
        element.getBoundingClientRect().top + window.scrollY;
      setScrollMargin((previous) =>
        previous === nextScrollMargin ? previous : nextScrollMargin,
      );
    };
    updateScrollMargin();
    const resizeObserver = new ResizeObserver(updateScrollMargin);
    resizeObserver.observe(document.body);
    window.addEventListener("resize", updateScrollMargin);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateScrollMargin);
    };
  }, []);

  const virtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: (index) =>
      rows[index].kind === "header"
        ? HEADER_ESTIMATED_HEIGHT
        : ITEM_ESTIMATED_HEIGHT,
    overscan: 6,
    scrollMargin,
    getItemKey: (index) => {
      const row = rows[index];
      return row.kind === "header"
        ? `header-${row.startTime}`
        : row.programItem.programItemId;
    },
    // Always render the active sticky header, even when it's scrolled out of the
    // measured range, so it can stay pinned to the top
    rangeExtractor: (range) =>
      [
        ...new Set([
          getActiveStickyHeaderIndex(stickyHeaderIndexes, range.startIndex),
          ...defaultRangeExtractor(range),
        ]),
      ].sort((a, b) => a - b),
  });

  const activeStickyHeaderIndex = getActiveStickyHeaderIndex(
    stickyHeaderIndexes,
    virtualizer.range?.startIndex ?? 0,
  );

  // Restore the scroll position on mount (e.g. returning via the back button)
  // and remember it on unmount. The virtualizer instance is stable, so this runs
  // once per mount/unmount
  useEffect(() => {
    if (savedTopRowIndex !== null && savedTopRowIndex > 0) {
      const targetIndex = savedTopRowIndex;
      // Run after the scroll margin has been measured (layout effect above)
      requestAnimationFrame(() => {
        virtualizer.scrollToIndex(targetIndex, { align: "start" });
      });
    }
    return () => {
      savedTopRowIndex = virtualizer.range?.startIndex ?? null;
    };
  }, [virtualizer]);

  const { programGuideUrl } = config.event();

  if (rows.length === 0) {
    return (
      <RaisedCard>
        <Container>
          <NoProgramItemsText>
            {t("noProgramItemsAvailable", {
              PROGRAM_TYPE: t(
                `programTypePartitivePlural.${activeProgramType}`,
              ),
            })}
          </NoProgramItemsText>
          <SecondNoProgramItemsText>
            {t("checkProgramGuide")}{" "}
            {programGuideUrl ? (
              <Link to={programGuideUrl} target="_blank">
                {t("programGuide")}
              </Link>
            ) : (
              t("programGuide")
            )}
            .
          </SecondNoProgramItemsText>
        </Container>
      </RaisedCard>
    );
  }

  return (
    <div ref={listRef}>
      <VirtualContainer style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const row = rows[virtualItem.index];
          const isActiveStickyHeader =
            row.kind === "header" &&
            virtualItem.index === activeStickyHeaderIndex;
          return (
            <VirtualRowWrapper
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              $sticky={isActiveStickyHeader}
              style={
                isActiveStickyHeader
                  ? undefined
                  : {
                      transform: `translateY(${virtualItem.start - scrollMargin}px)`,
                    }
              }
            >
              {row.kind === "header" ? (
                <ProgramItemListTitle startTime={row.startTime} />
              ) : (
                <ProgramItemEntry
                  isAlwaysExpanded={false}
                  programItem={row.programItem}
                  signups={
                    signupsByProgramItemId.get(row.programItem.programItemId) ??
                    []
                  }
                  signupStrategy={
                    row.programItem.signupStrategy ??
                    ProgramItemSignupStrategy.DIRECT
                  }
                  lotterySignups={ownOrGroupCreatorLotterySignups}
                  directSignups={directSignups}
                  username={username}
                  loggedIn={loggedIn}
                  userGroup={userGroup}
                  publicSignupQuestion={publicSignupQuestionByProgramItemId.get(
                    row.programItem.programItemId,
                  )}
                />
              )}
            </VirtualRowWrapper>
          );
        })}
      </VirtualContainer>
    </div>
  );
};

const VirtualContainer = styled.div`
  position: relative;
  width: 100%;
`;

const VirtualRowWrapper = styled.div<{ $sticky: boolean }>`
  left: 0;
  width: 100%;

  /* Contain the child card's vertical margins so the virtualizer measures the
     row's real footprint (margins are otherwise excluded from measurement) */
  display: flow-root;

  /* The active group header is pinned to the top of the viewport; all other
     rows are absolutely positioned by the virtualizer via an inline transform.
     The header's own 20px top margin is contained by flow-root, so the pin is
     lifted by that amount to keep the header flush with the viewport top */
  ${(props) =>
    props.$sticky
      ? `position: sticky; top: -20px; z-index: 2;`
      : `position: absolute; top: 0;`}
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
`;

const NoProgramItemsText = styled.span`
  color: ${(props) => props.theme.textSecondary};
  font-size: ${(props) => props.theme.fontSizeLarge};
`;

const SecondNoProgramItemsText = styled(NoProgramItemsText)`
  padding-top: 8px;
`;
