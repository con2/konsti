# Lottery Design Choices

The rules the lottery is built around. They are choices, not implementation notes: each one has a
defensible alternative, and what is written down is why that alternative loses. So when a change
makes one of these rules harder to hold, the change is usually the thing that is wrong. Implementation mechanics
live in [`server/CLAUDE.md`](../../server/CLAUDE.md); the terms used here are defined in
[terminology](../terminology.md).

One definition the rules below lean on: a **lottery program item** is one the lottery allocates -
its program type is in `twoPhaseSignupProgramTypes` and its sign-up is not always open
(`isLotterySignupProgramItem`). An always-open program item is never one, whatever its program
type - see choice 6.

## 1. A group lands in one program item, or none of it does

A group exists so its members attend the same thing together, and a lottery that places some of them
and not others is worse than one that places none. So either every member of a group gets a spot in
the same program item, or no member gets one.

This is about **spots the lottery hands out**. A member keeping a direct sign-up of their own while
the group goes unplaced is not a split - that sign-up was never the lottery's to give.

What follows from it:

- Every group takes part in full. Nothing withdraws a group over what one of its members happens to
  hold, because a group competing a member short could land the rest somewhere else.
- Anything that drops results before they are saved - a program item that no longer fits, say -
  drops a whole group at a time.
- A spot a member holds cannot split the group. If the group wins, that spot gives way (choice 3).

## 2. A direct sign-up is never deleted automatically unless keeping it would be incoherent

A direct sign-up is the attendee's own commitment, and Konsti removing one without being asked is a
cost to avoid at nearly any price. Only two places delete one automatically, and each has to be able
to say why keeping it would make no sense:

- The program item was deleted from the programme, so the sign-up refers to nothing.
- The lottery just gave the attendee a spot at the same start time, which they cannot attend
  alongside the one they hold (choice 3).

**Never speculatively.** A sign-up is only deleted once its replacement is known to land. Deleting
first and discovering afterwards that the new spot did not fit would leave the attendee with
neither, which is the worst outcome available.

Adding a third automatic deletion site should be treated as a design change, not an implementation
detail.

## 3. A spot won in the lottery overwrites a previous direct sign-up

When the lottery places an attendee, any direct sign-up they hold for that start time gives way to
it. They cannot attend both, and the lottery result is the newer decision.

This is what makes choice 1 possible: a group member who signed up to something else at that hour
still takes part with their group, and lands with them.

"That start time" is the hour the attendee turns up, not the hour the lottery ran: for a batched
program item those differ, and a spot at an hour they can still attend is left alone (choice 11).

## 4. Holding a direct sign-up does not keep you out of the lottery

An attendee may enter the lottery for a start time they already hold a spot at, and may take a spot
at a start time they already have lottery sign-ups for. Neither cancels the other, and the order
they were made in makes no difference. If the lottery places them, choice 3 applies and the spot
they win replaces the one they held; if it doesn't, the sign-up they made themselves simply
stands.

This holds for **every** spot they hold, including one a lottery gave them and a reschedule then
moved onto this start time. Protecting that one is no better: the attendee never ranked the moved
program item against the ones they entered here - the clash did not exist when they signed up - so
Konsti has no preference to honour, and guessing one means withdrawing whole groups over a single
member's spot. The sign-up form says plainly that winning here cancels what
they hold, which is the decision they actually get to make.

## 5. An event log item is never deleted, and what it says never changes

The event log and the emails are two views of the same story, and an email cannot be edited or
recalled once it is queued. So an item is written once and left to stand: not reworded later, not
deleted to tidy up. Anything else lets the two records disagree, and the inbox is the one Konsti
cannot fix.

The rule is about the message, so `isSeen` falls outside it - marking a notification read changes
nothing the item says, and has no counterpart in the inbox to disagree with.

This holds for every event log item, not only the lottery's. The lottery needs no de-duplication or
follow-up notices to satisfy it: it decides each start time once (choice 7), so it tells each
attendee about that start time once.

One consequence worth knowing: `getAssignmentBonus` reads a `NEW_ASSIGNMENT` item as "has been
assigned before", so an attendee who took a spot and later cancelled it doesn't get the first-time
bonus in a later lottery run. That follows from the log being history rather than current state,
and is the intended reading - they had their turn.

**Who cancelled decides whether the bonus survives.** The two cases read the same in the log and
must not be treated the same:

- **The attendee cancelled their own sign-up.** They chose to give the spot up, so it still counts
  against them and the bonus is spent.
- **The program item was cancelled.** They did not cause it and never got to attend, so the
  placement is not theirs to have spent - the bonus stays with them.

The log cannot tell them apart on its own, so the program item is what decides: a
`NEW_ASSIGNMENT` naming one that is gone does not count as having been assigned. Care is needed
because "gone" has to mean deleted or cancelled, not merely absent from the run being worked on -
a placement at another start time is still a placement, and reading absence too broadly hands the
bonus back to everyone the lottery has ever placed.

## 6. An always-open program item sits outside the lottery entirely

Some program items take sign-ups from the moment the programme opens rather than at their own
sign-up time - the ones listed in `directSignupAlwaysOpenIds` or tagged for the pre-convention week.
Their program type is not what decides this: an RPG whose sign-up is always open is still an
always-open program item, and the lottery leaves it alone.

`isLotterySignupProgramItem` is the single predicate for "does the lottery allocate this", and it
answers no for every always-open item. Everything else follows from that one answer rather than from
separate rules:

- The lottery never places anybody in one, and its spots are never counted against lottery capacity.
- Holding a spot in one does not keep the attendee out of the lottery (choice 4), so they still
  compete for that start time - and a spot the lottery gives them replaces it (choice 3).
- It never breaks a group. A member may sign up to one and stay in their group, and holding such a
  spot does not stop anyone creating or joining a group.

The last point is the one to be careful with. The argument for the harsher rule - taking a spot
alone is taking a spot alone - has nothing left to protect: because a spot never keeps its holder
out of the lottery, it cannot split a group there either.

## 7. The lottery for a start time happens once

A start time goes through one lottery. Running it again does nothing: whatever spots are still free
go to direct sign-up, which is what the attendee instructions already promise.

The alternative is a re-run that fills what is left. By the time anyone would reach for it the
direct sign-up phase is open, so it competes with the first-come queue, hands the leftovers to
lottery losers ahead of it, and moves attendees out of spots they picked themselves. A lottery that
has announced its result and then reopens is worse than one that is simply over.

**A run that failed before its critical write can still be run again**, up to the point where
direct sign-up opens. The one write anybody depends on is the single bulk write that saves the
spots; the mark, the messages and the stored record all come after it. So a run that returns an
error either placed nobody - safe to run again - or placed people and failed on bookkeeping, which
the next run works around rather than redoing.

Three things enforce the rule, at three different scopes:

- **The mark, per program item.** `lotteryRanForStartTime` records the start time a program item
  was lotteried for, written immediately after its spots are saved. A marked item never goes
  through another lottery. Storing the time rather than a flag is what lets `hasLotteryAlreadyRun`
  tell a **rescheduled** item - one whose lottery ran for a slot it no longer starts at - from one
  sitting where it was lotteried. The program item page uses that to say why it offers only direct
  sign-up, and `storeLotterySignup` uses it to refuse a late lottery sign-up. A program item no
  lottery will ever take carries `passedOverForLottery` instead: the two are different facts and
  are stored as such, so neither has to be guessed at from the clock. Both survive programme
  imports, left out of `saveProgramItems`' update object the way `popularity` is - the one
  exception being a save that is itself what passes a program item over (choice 8).
- **The spots, per program item.** A program item about to be lotteried that already holds a
  lottery-placed sign-up is evidence that a run got past its critical write and stopped before
  marking it. That item is skipped and logged, and the rest of the start time is lotteried as
  normal. Skipping is enough: a program item's spots are written in one atomic update, so the ones
  a half-finished run reached are whole and the ones it didn't are untouched. Its attendees do take
  part in the run that follows, and can be placed elsewhere, which costs nothing - a run that wrote
  spots but never reached the mark never told anyone about them, so nothing an attendee was
  promised is taken away. Refusing the whole start time instead would cost every other program item
  in that hour its lottery over one slipped item.
- **The clock, per run.** A manual run is refused outright once direct sign-up has opened for the
  start time it targets, because by then it would compete with the first-come queue. This is
  checked where the admin triggers it rather than inside the run: the cron derives its start time
  from the current time, so it is never late by construction, and every program item in one run
  shares a start time, so "too late" is true for all of them or none. What is left is the gap
  between the lottery and direct sign-up opening - the window for re-running one that failed. A
  lottery missed entirely is not recovered by running it late; it is announced with the admin
  message and the slot goes to direct sign-up.

## 8. A program item is empty when it is lotteried

**A program item holding direct sign-ups does not go into a lottery.** No spot the lottery hands
out is ever the second one given for a program item, and nothing it allocates is squeezed in around
sign-ups somebody else already made.

The lottery and first-come sign-up never decide the same program item. Direct sign-up for a lottery
program item opens only once the gap after its lottery has passed - and every program item that has
a lottery waits out that gap, including the first one of the event to get one.

Early slots are the exception, because they have no lottery to be gapped from. Lottery sign-up
cannot open before the doors do, so a program item whose lottery sign-up would already have closed
by then never gets one, and its direct sign-up opens with the event instead of a quarter of an hour
after it. Holding those back would delay sign-up for attendees who are already in the building, to
protect a lottery that is not going to happen.

So a lottery program item holding sign-ups when its lottery is due has arrived there by some other
route: it was always-open, or a non-lottery program type, and became a lottery item afterwards.
Lotterying whatever capacity is left would decide one program item by two different rules, with the
attendees who signed up early and the attendees in the lottery playing different games. It is left
on direct sign-up instead.

**Decided as soon as the programme shows it, not when a run gets there.** The import marks it the
first time it sees a lottery program item that already holds sign-ups, so the program item offers
direct sign-up and explains itself, and `storeLotterySignup` refuses - rather than taking lottery
sign-ups for hours for a lottery that will not happen, and telling those attendees "no spot" at the
end of it. The mark goes in with the same write that makes it true, so the program item is never
stored as a lottery item without one and there is no moment at which it can be offered as one.
Lottery sign-ups it carries from an earlier spell as a lottery program item are cancelled and
notified, the same way they are for a program item whose program type leaves the lottery. The
lottery run keeps its own version of the check as the backstop for a programme Konsti has not
imported yet.

**Recording it is what makes it stick.** Re-reading the decision from whoever holds a spot right
now would put the program item back into a lottery the moment the last sign-up was cancelled, which
is the same flip-flop the run avoids. Working it out from the clock is no better: the answer would
change on its own as the day went past the program item's sign-up window, and its direct sign-up -
open all along - would shut again for the length of a phase gap belonging to a lottery that never
ran. So `passedOverForLottery` is written down, and nothing reads it back out of the time.

One case this cannot distinguish: a program item whose direct sign-up was open but drew nobody looks
exactly like one whose sign-up never opened, and gets its lottery. That is the harmless direction -
no attendee is affected either way, and anyone who entered the lottery after the change is honoured
rather than discarded.

## 9. Every lottery that ran is recorded, whatever it placed

A lottery run that put at least one program item through a lottery writes to the results collection,
and it writes **even when it placed nobody** - that is a real outcome and the record says so. A run
that lotteried nothing writes nothing: the lottery runs on a timer, so most start times have nothing
for it to do, and recording those would bury the real results under empty ones. So a missing record
means the lottery never ran for that start time, not that it ran and achieved nothing.

One start time, one document. The collection is dumped and kept once the event is over, so it is the
only lasting account of what the lottery did, and a start time decided by two attempts still gets one
record: an attempt that saved its spots and failed before marking them can be run again (choice 7),
and the second attempt skips the program items the first one filled, so replacing the document would
drop the first attempt's placements from the record for good. The placements are therefore merged.
The run's own summary - its algorithm, its message, its group snapshot - describes the most recent
attempt rather than the pair, since those are properties of a run and not of the start time.

Attendees see a filtered view of this: `/dashboard` lists only runs that placed somebody, since a
run that placed nobody has nothing for them to read. The filter belongs to the dashboard, not to
what gets stored - the record is kept either way.

## 10. Direct sign-up, once open, stays open

A program item whose direct sign-up has been open keeps it open until the program item starts. It
never closes again, and never reopens later, whatever a recalculated sign-up time says.

Sign-up times are derived rather than stored, so a program item that changes underneath them -
moved to another slot, or changed to a program type on a different schedule - gets a new answer to
"when does sign-up open", and that answer can be in the future. Acting on it would shut a phase
attendees have already been given, on a program item whose attendee list is meanwhile filling up.
Taking something away is worse than the tidier schedule is good, so the schedule loses.

This is what a program item no lottery will take (choice 7) is doing on direct sign-up straight
away, rather than waiting for the slot it now sits at:

- Rescheduled after its lottery, its sign-up phase has already run at the slot it was lotteried
  for, and the attendees it placed are already in it.
- Passed over for holding sign-ups (choice 8), it collected those sign-ups while it was
  always-open or on a first-come schedule, so its sign-up was open by definition.

**It never shortens the gap after a lottery.** A program item still headed for a lottery is
untouched by this, so choice 8's rule that direct sign-up opens only once the gap has passed holds
unchanged, and a first-come sign-up still cannot land in a program item mid-run. The two
only ever meet on a program item the lottery has finished with.

The blind spot in choice 8 is this rule's too: a program item whose sign-up was open but drew nobody
is indistinguishable from one whose sign-up never opened, so it gets its lottery and its sign-up
does close for the lottery phase. Harmless in the same way - there is no sign-up to take back.

## 11. A parent start time batches a lottery, and nothing else

`startTimesByParentIds` exists for one job: to put program items that start at several different
times through a single lottery. It answers "when is this lotteried", and that is all it answers.

A direct sign-up is not part of that arrangement. It belongs to the program item's own starting
time - the hour the attendee turns up - whatever batch the program item happens to be lotteried in.
So a spot in a sub-session starting at 10:00 is a spot at 10:00, even where the batch it is
lotteried with runs at 09:00. What the spot clashes with, which spot a won one replaces, and what
the program item page tells the attendee all follow the item's own hour.

What the attendee is told follows the same rule, in the event log and in the email alike. A
placement names the hour of the program item they got. A rejection has no program item to name, so
it names the span the lottery covered instead: from the first program item's start to the last
one's end, which is the range the batch's own titles already carry. A run covering a single
starting time names that hour, as it always has.

The two are separate because they answer to different things. The batch time is an organiser's
device for running one lottery over several slots; the attendee's schedule is not part of it, and
they have no reason to expect a spot they hold at 10:00 to behave as though it were at 09:00. It
follows that the batch time is never shown to them: nothing they can see starts at it.

The parent-resolved time was stored once, so that a re-run could find the previous lottery's
sign-ups by start time and clear them before running again. The lottery runs once now (choice 7),
so nothing needs that and a sign-up records the hour it is actually held for.
