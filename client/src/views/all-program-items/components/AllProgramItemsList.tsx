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
  VirtualItem,
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
import { selectProgramTypeForTexts } from "client/views/admin/adminSlice";
import { config } from "shared/config";
import { registerScrollToTopOverride } from "client/utils/scrollToTop";

interface Props {
  programItems: readonly ProgramItem[];
  // Program item to briefly highlight (and scroll to) — the one the user just
  // came back from, or null
  highlightedProgramItemId: string | null;
}

// The grouped list is flattened into a single sequence of rows (a start-time
// header followed by its program items) so it can be window-virtualized
type VirtualRow =
  | { kind: "header"; startTime: string }
  | { kind: "item"; programItem: ProgramItem };

// Initial row-height guesses; the virtualizer measures the real heights on mount
const HEADER_ESTIMATED_HEIGHT = 60;
const ITEM_ESTIMATED_HEIGHT = 220;

// The window scroll offset and measured row sizes when the list unmounts, so
// returning to it (e.g. via the browser back button after viewing a program
// item) restores the exact scroll position — the clicked card comes back where
// it was. Module-scoped so it survives navigation within the SPA session
let savedScrollState: {
  offset: number;
  measurementsCache: VirtualItem[];
} | null = null;

export const AllProgramItemsList = ({
  programItems,
  highlightedProgramItemId,
}: Props): ReactElement => {
  const { t } = useTranslation();

  const signups = useAppSelector(
    (state) => state.allProgramItems.directSignups,
  );
  const lotterySignups = useAppSelector(selectLotterySignups);
  const directSignups = useAppSelector(selectDirectSignups);
  const programTypeForTexts = useAppSelector(selectProgramTypeForTexts);
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
    // Seeding the virtualizer with the previous visit's measured row sizes
    // lets the saved pixel offset land on the same rows instead of drifting on
    // height estimates. Only read when the virtualizer instance is created
    initialMeasurementsCache: savedScrollState?.measurementsCache,
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

  // Remember the scroll offset and row measurements on unmount so the exact
  // position can be restored on return (e.g. via the back button). Runs as a
  // layout-effect cleanup to capture the position before the next route
  // resets the window scroll. Neither direct offset source is reliable here
  // on WebKit: window.scrollY has already been pulled down by scroll
  // anchoring when the commit removed content above the list (and may be
  // clamped against the shrinking document), and the virtualizer's last
  // observed offset misses its own row-measurement compensation scroll while
  // the scroll event for it is still undelivered (WebKit dispatches scroll
  // events for programmatic scrolls asynchronously — under load only after
  // the navigation). The virtualizer tracks that undelivered compensation in
  // scrollAdjustments (cleared once the event arrives), so its intended
  // offset is scrollOffset + scrollAdjustments. The field is private, so
  // read it defensively — if it disappears in an upgrade, only the
  // undelivered-event case regresses
  useLayoutEffect(() => {
    return () => {
      const pendingAdjustments =
        (virtualizer as unknown as { scrollAdjustments?: number })
          .scrollAdjustments ?? 0;
      savedScrollState = {
        offset:
          (virtualizer.scrollOffset ?? window.scrollY) + pendingAdjustments,
        measurementsCache: virtualizer.takeSnapshot(),
      };
    };
  }, [virtualizer]);

  // On mount, restore the previous scroll position (e.g. returning via the back
  // button). The just-viewed item comes back exactly where it was and is
  // highlighted there. Guarded to run only once, when the list first has rows
  const hasRestoredScrollRef = useRef(false);
  useEffect(() => {
    if (hasRestoredScrollRef.current || rows.length === 0) {
      return;
    }
    hasRestoredScrollRef.current = true;

    if (!savedScrollState || savedScrollState.offset <= 0) {
      return;
    }

    const targetOffset = savedScrollState.offset;
    // The document keeps growing for a few frames after mount as rows are
    // measured and the scroll margin settles, so a single scrollTo can clamp
    // short (the document isn't tall enough yet) and stick there. Re-apply
    // across frames until the offset holds — WebKit most often lands short on
    // the first frame. Stop once the document stops growing (scrollY no longer
    // climbs) so an unreachable target doesn't keep yanking the user for the
    // full frame budget, e.g. when the list is now shorter than the saved offset
    const MAX_RESTORE_FRAMES = 30;
    const MAX_STALLED_FRAMES = 3;
    let attempts = 0;
    let stalledFrames = 0;
    let previousScrollY = -1;
    let rafId = 0;
    const restore = (): void => {
      window.scrollTo(0, targetOffset);
      attempts += 1;
      const scrollY = Math.round(window.scrollY);
      stalledFrames = scrollY > previousScrollY ? 0 : stalledFrames + 1;
      previousScrollY = scrollY;
      if (
        scrollY < Math.round(targetOffset) &&
        stalledFrames < MAX_STALLED_FRAMES &&
        attempts < MAX_RESTORE_FRAMES
      ) {
        rafId = requestAnimationFrame(restore);
      }
    };
    rafId = requestAnimationFrame(restore);
    return () => cancelAnimationFrame(rafId);
  }, [rows]);

  // Make scroll-to-top go through the virtualizer so the smooth scroll isn't
  // cancelled by row-measurement adjustments (see client/src/utils/scrollToTop.ts)
  useEffect(() => {
    return registerScrollToTopOverride(() => {
      virtualizer.scrollToOffset(0, { behavior: "smooth" });
    });
  }, [virtualizer]);

  const { programGuideUrl } = config.event();

  if (rows.length === 0) {
    return (
      <RaisedCard>
        <Container>
          <NoProgramItemsText>
            {t("noProgramItemsAvailable", {
              PROGRAM_TYPE: t(
                `programTypePartitivePlural.${programTypeForTexts}`,
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
                  isRecentlyViewed={
                    row.programItem.programItemId === highlightedProgramItemId
                  }
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
