# Lottery Design Rules

The rules the lottery is built around. They are decisions, not implementation notes: each one has a
defensible alternative, and what is written down is why that alternative loses. So when a change
makes one of these rules harder to hold, the change is usually the thing that is wrong. Implementation mechanics
live in [`server/CLAUDE.md`](../../server/CLAUDE.md); the terms used here are defined in
[terminology](../terminology.md).

One definition the rules below lean on: a **lottery program item** is one the lottery allocates -
its program type is in `twoPhaseSignupProgramTypes` and its sign-up is not always open
(`isLotterySignupProgramItem`). An always-open program item is never one, whatever its program
type - see [rule 1][1].

Several rules record a **gap rather than a decision**: a place where the code does not yet do what
the rule says, kept here because a known hole is worth more than a rule that quietly does not hold.
They are collected in [Known gaps](#known-gaps) at the end.

## The rules

1. [An always-open program item sits outside the lottery entirely][1]
2. [A ranking is at most three program items at a start time, each at a different priority][2]
3. [A group lands in one program item, or none of it does][3]
4. [A first-time bonus goes to attendees who hold no lottery spot yet][4]
5. [A program item is filled to its minimum or not at all][5]
6. [The lottery for a start time happens once][6]
7. [A program item is empty when it is lotteried][7]
8. [A parent start time decides when a lottery runs, not where the attendee is][8]
9. [Direct sign-up, once open, stays open][9]
10. [A spot won in the lottery overwrites one the attendee already holds at that hour][10]
11. [Holding a direct sign-up does not keep you out of the lottery][11]
12. [A direct sign-up is never deleted automatically unless keeping it would be incoherent][12]
13. [A lottery sign-up is never deleted once its lottery has run][13]
14. [An event log item is never deleted, and what it says never changes][14]
15. [Every lottery that ran is recorded, whatever it placed][15]

## 1. An always-open program item sits outside the lottery entirely

Some program items take sign-ups from the first moment sign-up exists for them at all, rather than
at the sign-up time their program type would give them: the ones listed in
`directSignupAlwaysOpenIds`, which open with the event, and the ones tagged for the pre-convention
week, which open at the pre-convention week's own configured time. "Always open" is that, not
literally always. Their program type is not what decides it either: an RPG whose sign-up is always
open is still an always-open program item, and the lottery leaves it alone.

`isLotterySignupProgramItem` is the single predicate for "does the lottery allocate this", and it
answers no for every always-open item. Everything else follows from that one answer rather than from
separate rules:

- The lottery never places anybody in one, and its spots are never counted against lottery capacity.
- A spot in one costs its holder nothing in the lottery: it does not keep them out of it ([rule 11][11]),
  and it does not spend their first-time bonus ([rule 4][4]), for the same reason it is not counted
  against capacity - it was never a spot the lottery would have handed out. What it does not buy is
  protection, since a spot the lottery gives them at that hour replaces it ([rule 10][10]) whoever
  gave it.
- It never breaks a group. A member may sign up to one and stay in their group, and holding such a
  spot does not stop anyone creating or joining a group.

The last point is the one to be careful with. The argument for the harsher rule - taking a spot
alone is taking a spot alone - has nothing left to protect: because a spot never keeps its holder
out of the lottery, it cannot split a group there either.

**A program item can become one after taking lottery sign-ups.** The pre-convention week tag is read
from the programme on every import, so an item that has been in the lottery can turn always-open
under it. The sign-ups it carries go the way a program item's do when its program type leaves the
lottery, and by the same route: cancelled and announced while its lottery is still ahead, kept and
unannounced once it has run ([rule 13][13]). Nothing separates the two cases because they are one fact -
the lottery no longer allocates this program item.

**The predicate guards every read of the lottery but not the write that makes a lottery sign-up, and
that is a gap rather than a decision.** `storeLotterySignup` asks whether the program item is
cancelled, hidden, valid, still signed up for through Konsti, and whether a lottery is still ahead
of it - never whether the lottery allocates it at all. A pre-convention week item is refused by
accident: its lottery window closes before the event opens, so every request reads as too early or
too late. An always-open item of a lottery program type has a real window, so a sign-up from a stale
page or a hand-made request is stored. The run then ignores it, and the next import either removes
it with a cancellation the attendee never earned - permanent under [rule 14][14] - or, once the
window has passed, keeps it for good as a record of a lottery that never existed. Nothing exercises
it while `directSignupAlwaysOpenIds` is empty, which it is for Tracon 2026. Closing it means the write
asking `isLotterySignupProgramItem` the way every reader does, which would cover a non-lottery
program type at the same time.

## 2. A ranking is at most three program items at a start time, each at a different priority

An attendee ranks program items first, second or third, and a priority they have already used at
that start time is refused. So a ranking carries no ties, and its length follows from that rather
than from a limit of its own: there are three priorities, so there are at most three program items
at any one start time.

The rank is the whole of what the lottery scores a preference by ([rule 4][4]), so a tie would hand it
two program items the attendee declined to choose between and leave it to break the tie for them.
Three is what the sign-up form offers; nothing in the lottery depends on the number itself.

**A spot records the preference it was won at.** A lottery win carries the rank that won it and a
first-come sign-up carries zero, so a stored spot says which of the two gave it - which is what lets
the results record and the dump the event leaves behind tell them apart ([rule 15][15]).

**Which start time this is asked at is the program item's own hour**, not the hour its lottery runs
at, so a batch spanning three starting times can be entered carrying three first preferences, which
[rule 8][8] records as a gap.

## 3. A group lands in one program item, or none of it does

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
- A spot a member holds cannot split the group. If the group wins, that spot gives way ([rule 10][10]).

**The group enters with one list of preferences, the creator's.** A member makes none of their own:
signing up is refused while they are in a group, and joining one gives up the lottery sign-ups they
were still waiting on. So there is a single ranking to place the group by. Merging the members'
lists instead would leave the lottery choosing which of them to honour, and a group that disagrees
with itself has no one program item to land in.

**Its size is who is in it when the lottery runs**, not who was in it when the creator signed up. A
member joining afterwards enlarges the group and one leaving shrinks it, and the lottery reserves
spots for the group it finds. A group that has outgrown a program item's attendance limit therefore
lands nowhere rather than partly, which is this rule holding rather than failing.

**The write is the exception, and [rule 7][7] is what covers it.** The attendance limit is applied once
more as the spots are saved, over a flat list of attendees rather than over groups, so a group
arriving at a program item with less room than it needs would be cut part way through and stored
split. Nothing afterwards puts it back: the members who landed are recorded as placed, and the rest
are told they got nothing. The room is never short, because a program item is empty when it is
lotteried - so here the guarantee rests on that rule rather than on the write.

## 4. A first-time bonus goes to attendees who hold no lottery spot yet

The lottery scores each preference by its rank, and adds a bonus on top for an attendee it has not
given a spot to. Two of them: the first-time bonus (`firstSignupBonus`) for an attendee who holds no
lottery spot and has never been placed, and an additional one (`additionalFirstSignupBonus`) on top
for an attendee who entered an earlier lottery and came away with nothing. Everyone gets a turn
across the event, and losing once counts for something the next time.

**One bonus, added to every preference alike.** It belongs to the attendee, not to the program item
being scored, so it is worked out once and added equally to each preference they submitted in this
run. That is what stops it reordering their own choices - it lifts them against everybody else while
their first choice stays ahead of their third. Scoring it per preference instead would reward
submitting more of them, which is not what it is for.

**The score is what the algorithms are handed, not what they maximize.** How far the bonus actually
reaches is each algorithm's own business, and the three the event can be configured for differ. The
random one never lets the score steer a draw: it assembles whole assignments at random and uses the
score only to rank the finished ones, and because the bonus is many times the whole rank scale, that
ranking mostly counts how many bonus-carrying groups landed rather than which preference anyone got.
PADG orders its list by the score in the first of its rounds alone - the others order by group size
or shuffle - and the round it keeps is chosen by a happiness figure that reads preference rank and
never sees the bonus. Running both and taking whichever placed more attendees weighs neither. So an
event that changes its algorithm changes what the bonus is worth, and the bonus is a thumb on the
scale rather than a promise.

The score is also per group rather than per attendee, so wherever it is summed, a qualifying group
of one is worth exactly what a qualifying group of five is.

**Holding a spot in a lottery program item spends it**, however the spot was got. That includes the
early slots, which are direct sign-up only because no lottery can reach them ([rule 7][7]): the spot is
still one the lottery would otherwise have handed out. A spot in an always-open program item does
not spend it, because such an item sits outside the lottery entirely ([rule 1][1]) - taking one was never
taking a lottery spot, which is the same reason it is not counted against lottery capacity.

**Being placed spends it, and giving the spot back does not return it.** The event log is history
rather than current state ([rule 14][14]), so an attendee who won a spot and then cancelled it themselves
has had their turn. What they cannot spend is a placement they never got to attend: if the program
item was cancelled or deleted they did not cause it, so the bonus stays with them. The log cannot
tell the two apart on its own, so the program item decides - a placement naming one that is gone
does not count. "Gone" has to mean cancelled or deleted rather than merely absent from the run being
worked on, since a placement at another start time is still a placement, and reading absence too
broadly would hand the bonus back to everyone the lottery has ever placed.

**The spot half asks nothing of the programme, and that is a gap rather than a decision.** A
placement is discounted when the program item it names is gone; a spot is not. The sign-ups the run
reads are filtered by whether the lottery allocates the program item at all, never by whether it is
still happening, so a spot in a cancelled program item would spend a bonus that the matching
placement would leave alone. Nothing reaches it, because the import removes direct sign-ups for a
cancelled program item as soon as it sees the cancellation ([rule 12][12]) - so this rests on that
cleanup rather than on the check the paragraph above describes. Closing it means the spot half
asking the same question of the programme that the placement half asks.

**A run never reads its own work as history.** A run that placed people and failed before marking
its program items can be run again ([rule 6][6]), so the retry excludes the placements and the rejections
the first attempt wrote for this start time. Otherwise it would strip the bonus from the attendees it
had just placed, and hand the additional one to the very attendees it had just turned down.

**A rejection is recognized by its hour alone, and that is a gap rather than a decision.** A
placement has to match both the program item and the hour, because neither half alone will do: an
item can carry a placement from before it was rescheduled onto this hour, and another lottery can
cover this hour with items of its own. A rejection names no program item ([rule 8][8]), so only the
hours are left - the run's own, and the ones its program items start at. Both directions of that
are wrong, and both need a batch to reach. Another lottery's rejection at one of a batch's hours
reads as this run's own and is discarded, costing its holder the additional bonus they earned. And a
rejection stores the span its own attempt covered, which shifts if a program item was cancelled or
moved between two attempts ([rule 14][14]), so a retry over a batch whose own hour is not one its program
items start at can fail to recognize its own first attempt and hand the additional bonus to the very
attendees it just turned down. Closing either means giving a rejection something durable to be
matched by, which is the same thing [rule 14][14] wants for the duplicate it cannot yet suppress.

**A group is judged as a whole, on a threshold.** The first-time bonus goes to the group when half
its members or more have no previous spot or placement; the additional one when half or more carry
an earlier rejection. Both are counted over the whole group, and an exact half is enough for either.
Only a member who is new by the first test can carry a rejection into the second, so the additional
bonus never arrives on its own: a group that earns it has earned the first-time bonus already. A
group lands in one program item or none ([rule 3][3]), so its members cannot be scored separately, and an
attendee signing up alone is a group of one where the threshold is simply themselves.

## 5. A program item is filled to its minimum or not at all

Every program item carries a minimum attendance from the programme, and the lottery reads it as a
requirement rather than a target: it places at least that many attendees in a program item, or it
places none at all. One too few people entered for is left empty, and everyone who ranked it is told
they got no spot even though there were spots to give.

The alternative is to place them anyway and leave the organiser to decide whether to run it. It
loses because the minimum is the organiser's own answer to what the program item needs, and an
attendee placed in one that then cannot run is worse off than one the lottery turned down: a
rejection leaves their hour free for the first-come phase and counts towards their next lottery
([rule 4][4]), where the spot ties them to something that may not happen.

**Both algorithms enforce it themselves**, and Konsti's part is only to hand over the figure. The
random one throws out any assignment that leaves a program item short; PADG makes up the shortfall
with phantom attendees and drops what it still cannot fill. The figure handed over is the room the
program item has, floored at one attendee so the assigner is never given a minimum of zero, and
capped by the spots remaining so it is never given one larger than the maximum.

**It is a condition on what the lottery hands out, not a promise about what the program item ends up
with.** Nothing re-checks it afterwards: attendees cancelling can leave a program item under its
minimum and it stays there, since the lottery does not revisit a start time ([rule 6][6]). Direct sign-up
fills the leftovers without asking about it either.

## 6. The lottery for a start time happens once

A start time goes through one lottery. Running it again does nothing: whatever spots are still free
go to direct sign-up, which is what the attendee instructions already promise.

The alternative is a re-run that fills what is left. By the time anyone would reach for it the
direct sign-up phase is open, so it competes with the first-come queue, hands the leftovers to
lottery losers ahead of it, and moves attendees out of spots they picked themselves. A lottery that
has announced its result and then reopens is worse than one that is simply over.

**A run that failed can still be run again**, within the window the third scope below sets out. The
one write anybody depends on is the bulk write that saves the spots; the mark, the messages and the
stored record all come after it, and each logs its own failure rather than failing the run. So a run
that returns an error failed at or before that write, and one that placed people and then lost its
bookkeeping reports success.

That write is one update per program item rather than one update over all of them, so a run that
returns an error may still have placed the attendees of the program items it reached before it
stopped. That is the case the second scope below recognizes and works around, rather than redoing.

Three things enforce the rule, at three different scopes:

- **The mark, per program item.** `lotteryRanForStartTime` records the hour a program item was
  lotteried for, written immediately after its spots are saved. A marked item never goes through
  another lottery. The hour recorded is the program item's **own** start time rather than the one
  the run targeted: for a batch those differ ([rule 8][8]), and a parent time reads the same before and
  after one of its items moves, so a mark taken from it could never detect a move at all. Storing a
  time rather than a flag is what lets `hasLotteryAlreadyRun` tell a **rescheduled** item - one
  whose lottery ran for a slot it no longer starts at - from one sitting where it was lotteried.
  The run itself is what needs that distinction: an item that arrives already marked must not close
  an hour whose own lottery has never happened. The program item page needs it too, to say which of
  the two reasons it is offering only direct sign-up for. Refusing a late lottery sign-up needs
  neither answer and asks the broader question instead - no lottery is coming, whichever way. A
  program item no lottery will ever take carries `passedOverForLottery`: the two are different
  facts and are stored as such, so neither has to be guessed at from the clock. Both survive
  programme imports, left out of `saveProgramItems`' update object the way `popularity` is - the
  one exception being a save that is itself what passes a program item over ([rule 7][7]).
- **The spots, per program item.** A program item about to be lotteried that already holds a
  lottery-placed sign-up is evidence that a run got past its critical write and stopped before
  marking it. That item is skipped and logged, and the rest of the start time is lotteried as
  normal. It is recorded as passed over in the same breath, so cancelling the spots it holds cannot
  hand it back to a later lottery. Skipping is enough: a program item's spots are written in one
  atomic update, so the ones
  a half-finished run reached are whole and the ones it didn't are untouched. Its attendees do take
  part in the run that follows, and can be placed elsewhere, which costs nothing - a run that wrote
  spots but never reached the mark never told anyone about them, so nothing an attendee was
  promised is taken away. Refusing the whole start time instead would cost every other program item
  in that hour its lottery over one slipped item.
- **The clock, per run.** A manual run has to land between lottery sign-up closing and direct
  sign-up opening, and is refused on both sides of that gap. Too early, it decides the start time
  behind attendees who are still entering the lottery, and an hour that happens once gives them no
  second chance. Too late, it competes with the first-come queue. Both are checked where the admin
  triggers it rather than inside the run: the cron derives its start time from the current time, so
  it is on the mark by construction, and every program item in one run shares a start time, so
  either verdict is true for all of them or none. The gap between the two is the window for
  re-running a run that failed. A lottery missed entirely is not recovered by running it late; it
  is announced with the admin message and the slot goes to direct sign-up.

**What arrives after the hour is decided joins it on direct sign-up.** A lottery program item added
to a start time whose lottery has run is recorded as passed over on the spot, rather than left for
the clock to rule on later. That is what refuses a lottery sign-up for it, and what keeps its
direct sign-up open once whatever it collects is cancelled, for the reasons [rule 7][7] gives for
writing the same fact down rather than deriving it.

## 7. A program item is empty when it is lotteried

**A program item holding spots does not go into a lottery.** No spot the lottery hands out is ever
the second one given for a program item, and nothing it allocates is squeezed in around sign-ups
somebody else already made. Normally those spots are direct sign-ups; a spot left behind by a run
that stopped before marking its program item counts the same, and is what [rule 6][6] recognizes.

The lottery and first-come sign-up never decide the same program item. Direct sign-up for a lottery
program item opens only once the gap after its lottery has passed - and every program item that has
a lottery waits out that gap, including the first one of the event to get one.

Early slots are the exception, because they have no lottery to be gapped from. Lottery sign-up
cannot open before the doors do, so a program item whose lottery sign-up would already have closed
by then never gets one, and its direct sign-up opens with the event instead of a quarter of an hour
after it. Holding those back would delay sign-up for attendees who are already in the building, to
protect a lottery that is not going to happen.

**An hour of slack is what keeps the two arrangements apart, rather than a check.** Direct sign-up
falls back to the event start for every program item whose lottery would close within an hour of
the doors opening, where the lottery window is empty only for those whose lottery would close at or
before that moment. So a program item whose lottery closes during that hour would be taking
first-come sign-ups from the doors while still accepting lottery entries. Nothing lands there: a
lottery program item starts on the hour and so does the event, so its lottery closes on the hour
too. A batched program item is the one exempt from that requirement, so a parent start time set
inside that hour is the one thing that could open it.

So a lottery program item holding spots when its lottery is due has arrived there by some other
route. Either it was always-open, or a non-lottery program type, and became a lottery item
afterwards - or it sat at an early slot, took sign-ups there because no lottery was coming for it,
and was then moved to a slot where one is. Neither needs handling of its own: the decision is made
against wherever the program item now sits, every time the programme is saved.

Lotterying whatever capacity is left would decide one program item by two different rules, with the
attendees who signed up early and the attendees in the lottery playing different games. It is left
on direct sign-up instead.

**Decided as soon as the programme shows it, not when a run gets there.** The import marks a lottery
program item it finds already holding spots, so the program item offers direct sign-up and explains
itself, and `storeLotterySignup` refuses - rather than taking lottery sign-ups for hours for a
lottery that will not happen, and telling those attendees "no spot" at the end of it. The mark goes
in with the same write that makes it true, so there is no moment at which a program item is stored
as a lottery one holding spots without it. Lottery sign-ups it carries from an earlier spell as a
lottery program item are cancelled and notified while their lottery is still ahead, and left alone
once it has run, the same way they are for a program item whose program type leaves the lottery
([rule 13][13]). The lottery run keeps its own version of the check as the backstop for a programme
Konsti has not imported yet.

**The run counts capacity as though the rule might not hold.** A program item's spots are offered to
the algorithms as the room left after whoever already holds one, which under this rule is always the
whole item. Like the run's own check, it is defence in depth rather than a second arrangement, and
nothing reaches it.

**It marks only while direct sign-up has yet to open on the schedule.** Past that point the program
item is offering direct sign-up either way, so the mark would record a decision the clock has
already made, and the run's own check covers a lottery somehow still coming. This is why a program
item sitting at an early slot with sign-ups is left unmarked, and marked only if it moves onto a
slot where a lottery is still ahead. The line is drawn at direct sign-up opening rather than at the
lottery closing, so a program item that becomes a lottery one inside the gap between the two is
still marked, and keeps the sign-up it already had open ([rule 9][9]) instead of having it shut for the
rest of the gap.

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

## 8. A parent start time decides when a lottery runs, not where the attendee is

`startTimesByParentIds` exists for one job: to put program items that start at several different
times through a single lottery. What follows from it is a split between two questions, and every
answer this rule gives comes from deciding which of the two is being asked.

**The batch time decides when.** When the lottery runs, and with it when lottery sign-up closes and
when direct sign-up opens: the whole batch shares one of each, because both are measured from the
run they are gapped from ([rule 7][7]). Anchoring those to a program item's own hour instead would leave
a sub-session starting at 10:00 in a batch lotteried at 09:00 taking lottery sign-ups for an hour
after its lottery had already been decided, and holding its first-come phase shut for that same
hour. Only the end of direct sign-up is the program item's own, because sign-up closes when it
starts.

**The program item's own start time decides where the attendee is.** A spot in that sub-session is
a spot at 10:00, whatever batch it was lotteried in. What it clashes with, which spot a won one
replaces, and which hour a sign-up records all follow the program item's own hour.

What the attendee is told follows that same division, in the event log and in the email alike. A
placement names the hour of the program item they got. A rejection has no program item to name, so
it names the span the lottery covered instead: from the first program item's start to the last
one's end, which is the range the batch's own titles already carry. A run covering a single
starting time names that hour, as it always has.

The two are separate because they answer to different things. The batch time is an organiser's
device for running one lottery over several slots; the attendee's schedule is not part of it, and
they have no reason to expect a spot they hold at 10:00 to behave as though it were at 09:00. So it
is shown only where the batch itself is what is being described - the lottery sign-up list groups by
it, one ranking covering the whole batch - and never as a program item's own hour.

The parent-resolved time was stored once, so that a re-run could find the previous lottery's
sign-ups by start time and clear them before running again. The lottery runs once now ([rule 6][6]),
so nothing needs that and a sign-up records the hour it is actually held for.

**Which preferences compete against each other is the program item's own hour, and that is a gap
rather than a decision.** A ranking is part of the lottery, so by the division above it should
follow the batch; the duplicate-priority check asks the program item's own start time instead, in
the sign-up form and again at the write. An attendee can therefore enter one batched run carrying
several first preferences - three, where the batch spans three starting times - each scoring what a
first preference scores, while an attendee ranking three program items at a single starting time has
their second and third scored lower. Closing it means both checks asking which run a program item is
lotteried in rather than which hour it starts at.

## 9. Direct sign-up, once open, stays open

A program item the lottery will not take keeps its direct sign-up open until the program item
starts. It never closes again, and never reopens later, whatever a recalculated sign-up time says.

Sign-up times are derived rather than stored, so a program item that changes underneath them -
moved to another slot, or changed to a program type on a different schedule - gets a new answer to
"when does sign-up open", and that answer can be in the future. Acting on it would shut a phase
attendees have already been given, on a program item whose attendee list is meanwhile filling up.
Taking something away is worse than the tidier schedule is good, so the schedule loses.

This is what a program item no lottery will take ([rule 6][6]) is doing on direct sign-up straight
away, rather than waiting for the slot it now sits at:

- Rescheduled after its lottery, its sign-up phase has already run at the slot it was lotteried
  for, and the attendees it placed are already in it.
- Passed over for holding sign-ups ([rule 7][7]), it collected those sign-ups while it was
  always-open or on a first-come schedule, so its sign-up was open by definition.
- Added to a start time whose lottery has already run ([rule 6][6]), it has no lottery phase of its own
  left to wait out - the hour's is behind it, and the spots it brings are the leftovers the
  attendee instructions promise to the first-come queue.

**It never shortens the gap after a lottery.** A program item still headed for a lottery is
untouched by this, so [rule 7][7]'s rule that direct sign-up opens only once the gap has passed holds
unchanged, and a first-come sign-up still cannot land in a program item mid-run. The two
only ever meet on a program item the lottery has finished with.

**Two questions, and both are needed.** "Is direct sign-up open for this program item" and "has the
first-come phase for this start time begun" answer differently for one let out early, so they are
asked through different predicates. Everything shown to an attendee, and the server gate behind it,
asks the first. The lottery run and the check that passes a program item over ask the second, which
is a property of the start time: one item on early direct sign-up must not make its hour read as too
late to lottery, nor pass over the items that arrived with it. Collapsing them into one would break
rules [6][6] and [7][7] rather than this one.

**Having been open is nowhere recorded, so the rule reaches only as far as the lottery's own marks -
a gap rather than a decision.** It is inferred from the two marks that say no lottery is coming, and
only a lottery program item ever carries either. Everything else is held by its derived time alone:
a rolling or windowed program item - most of the programme, since a lottery program type is the
exception - has its open sign-up shut again by a move to a later slot, and its attendees keep the
spots they hold while nobody else can join them. A program type change does the same wherever the
new schedule opens later, which today takes a sign-up window, the rolling schedule being the earlier
of the two. Closing the gap means recording that direct sign-up has been open, for every program
item rather than only for the ones the lottery has finished with.

The blind spot in [rule 7][7] is this rule's too: a program item whose sign-up was open but drew nobody
is indistinguishable from one whose sign-up never opened, so it gets its lottery and its sign-up
does close for the lottery phase. Harmless in the same way - there is no sign-up to take back.

## 10. A spot won in the lottery overwrites one the attendee already holds at that hour

When the lottery places an attendee, every spot they hold at that start time gives way to it. Two
program items starting at the same hour cannot both be attended, and the lottery result is the newer
decision.

**Whoever gave them the spot.** Usually they took it themselves, but one an earlier lottery won them
and a reschedule then moved onto this hour goes the same way, for the reasons [rule 11][11] sets out.
Several are possible at one hour, and all of them go.

This is what makes [rule 3][3] possible: a group member who signed up to something else at that hour
still takes part with their group, and lands with them.

"That start time" is the hour the attendee turns up, not the hour the lottery ran: for a batched
program item those differ, and a spot at another hour is left alone ([rule 8][8]).

**The same hour, not everything that clashes.** A program item running long overlaps the hours after
it, and a spot in one of those stays put even though the attendee cannot be in both. Konsti already
lets them hold overlapping sign-ups by their own hand, so the lottery is not the place to start
refusing them: it displaces the spot it is unambiguously replacing and leaves the rest of their
schedule to them.

**So the lottery never leaves an attendee two spots at one start time, though nothing else stops
them holding two.** The direct sign-up write asks nothing about the rest of an attendee's
programme, so they may take a second spot at an hour they already hold one at, the same way they
may take an overlapping one. It is the lottery's own half of this that the merged results record
rests on: a second placement of one attendee at a start time is read there as a correction rather
than as a second spot ([rule 15][15]).

**Nothing is said about the spot that went.** The attendee is told they won, and whichever form
they confirmed told them that winning cancels what they hold at that hour ([rule 11][11]). The
removal is the offer they accepted rather than news, so a message announcing it would be Konsti
reporting back the half of the decision they already made.

**The removal is the one part that can fail without failing the run.** It happens after the spots
are saved, so a failure there costs nobody a place - it leaves an attendee holding a spot the
lottery has replaced, which an admin can remove. That is the direction to fail in: removing first
and finding afterwards that the replacement did not land would leave them with neither ([rule 12][12]).

## 11. Holding a direct sign-up does not keep you out of the lottery

An attendee may enter the lottery for a start time they already hold a spot at, and may take a spot
at a start time they already have lottery sign-ups for. Neither cancels the other, and the order
they were made in makes no difference. If the lottery places them, [rule 10][10] applies and the spot
they win replaces the one they held; if it doesn't, the sign-up they made themselves simply
stands.

This holds for **every** spot they hold, including one a lottery gave them and a reschedule then
moved onto this start time. Protecting that one is no better: the attendee never ranked the moved
program item against the ones they entered here - the clash did not exist when they signed up - so
Konsti has no preference to honour, and guessing one means withdrawing whole groups over a single
member's spot. The lottery sign-up form says plainly that winning here cancels what they hold,
which is the decision they actually get to make.

**Both orders are warned about.** The lottery sign-up form says it to an attendee entering the
lottery while already holding a spot, and the direct sign-up form says it to one taking a spot at a
start time whose lottery still lies ahead of them. Neither order arrives unannounced, which is what
[rule 10][10]'s silence afterwards rests on. A sign-up kept as a record of a lottery that has
already run ([rule 13][13]) is not warned about, having nothing left to take the spot away.

**The lottery sign-up form still names a single held spot, and that is a gap rather than a
decision.** It names the first spot it finds at that hour, where several are possible and all of
them go. Closing it means naming every one of them, as the direct sign-up form already names every
lottery sign-up at the start time.

## 12. A direct sign-up is never deleted automatically unless keeping it would be incoherent

A direct sign-up is the attendee's own commitment, and Konsti removing one without being asked is a
cost to avoid at nearly any price. Five things delete one automatically, and each has to be able to
say why keeping it would make no sense:

- The program item was deleted from the programme, so the sign-up refers to nothing.
- It was cancelled, so there is nothing left to turn up to.
- It stopped using Konsti sign-up, so Konsti is no longer where its attendee list is kept.
- An admin hid it, so it is gone from every view the attendee has - they can no longer see the spot
  they hold, or give it up.
- The lottery just gave the attendee a spot at the same start time, which they cannot attend
  alongside the one they hold ([rule 10][10]).

**What is not on the list.** A program item changing to a program type outside the lottery keeps its
sign-ups: it is still happening, and still signed up for through Konsti. So does one moved to
another slot - the attendee did not cause the move, and the spot they hold simply competes with
whatever the new slot brings ([rule 11][11]).

This is the opposite of what [rule 13][13] does with a lottery sign-up, and deliberately so: a lottery
sign-up whose lottery has run is a record of having entered, where a direct sign-up is a claim on a
spot that is no longer there.

**Never speculatively.** A sign-up is only deleted once its replacement is known to land. Deleting
first and discovering afterwards that the new spot did not fit would leave the attendee with
neither, which is the worst outcome available.

**Hiding is the one that says nothing, and that is a gap rather than a decision.** The other three
programme changes each write their own event log item and queue an email; hiding removes the
sign-ups silently, and unhiding does not bring them back, so the attendee is left to notice that
something has gone from their own programme. Closing it means giving hiding an action of its own,
the way each of the others has one.

Adding a sixth automatic deletion site should be treated as a design change, not an implementation
detail.

## 13. A lottery sign-up is never deleted once its lottery has run

A lottery sign-up is a request while its lottery is ahead, and a record of having entered once the
lottery has decided. Nothing automatic deletes one after that line, whatever happens to the program
item afterwards: it is cancelled, moved to another slot, stops using Konsti sign-up, changes to a
program type outside the lottery, or is passed over for holding sign-ups. All of those still remove
a sign-up whose lottery has not run, because it asks for something that will not happen; none of
them removes one whose lottery has.

The line is `getLotterySignupEnded`, the moment lottery sign-up closes and the run decides the start
time. It is a negated comparison on purpose, so a start time that cannot be resolved reads as ended:
these are unattended deletions, and the direction they fail in has to be the one that keeps.

**Six places remove a lottery sign-up, and the guarantee has to hold at each.** The programme import
classifies the four changes above and removes what they invalidate; a move is handled separately, as
is a program item passed over for holding sign-ups. Joining a group gives up the sign-ups the member
was still waiting on ([rule 3][3]). Hiding removes them whatever their lottery has done, which is the
second exception below. And a run removes the remaining sign-ups of the attendees it places, either
the ones overlapping the spot just won or all their upcoming ones, according to the event's
configured strategy. Adding a seventh should be treated as a design change, not an implementation
detail.

**The attendee cannot take one back either.** A record that survives only until its holder tidies it
away is not much of a record, so `removeLotterySignup` refuses once the sign-up window has closed.
What the event leaves behind is therefore every entry, rather than every entry nobody got round to
deleting.

**The event's data is read after the event, not during it.** Each convention's database is dumped
once it is over and kept for study, and the sign-ups are what say who entered which lottery and at
what preference. A run's results record who it placed; only the sign-ups say who it turned down, or
who competed for a program item that filled. Deleting them later leaves a dump whose results cannot
be explained by its inputs, and the deletion is invisible in it - the row is simply not there. The
tidiness gained is worth nothing next to that, since a sign-up whose lottery has run cannot win
anything anyway.

This is the same principle as [rule 14][14], applied to the other record: an event log item is never
deleted because the attendee was told, a past lottery sign-up because the lottery happened.

**Nothing is said about it, and nothing needs to be.** A program item leaving the lottery after its
lottery has run used to remove the sign-ups it carried and tell their holders so. Now that they are
kept, there is no removal to announce, and the attendee is told nothing. That is the right silence:
their lottery is behind them and its outcome has already reached them, so a sign-up for it is a
record they have no decision left to make about. What the program item offers them now is on its own
page. A message here would be Konsti raising something the attendee has finished with.

**Two exceptions. The first is about what can be asked rather than what is wanted.** A program item
deleted from the programme is gone, so there is no start time left to work out whether its lottery
had run, and its sign-ups are removed as [rule 12][12] removes direct sign-ups for it - they refer to
nothing. A sign-up's own `signedToStartTime` is not a safe substitute: for a batched program item it
is the attendee's hour rather than the hour the lottery ran at, so it would answer the question
wrongly in the direction that deletes. Cancelling a program item, which keeps it in the programme,
is the route that preserves both the item and the sign-ups.

**The second is hiding, and it is a gap rather than a decision.** An admin hiding a program item
removes the lottery sign-ups it carries whatever their lottery has done, without asking
`getLotterySignupEnded` and without telling anyone. The first exception's excuse does not cover it:
a hidden program item is still in the programme, so the question can be asked here - it simply is
not. Unhiding brings nothing back, and the dump the event leaves behind is missing exactly the rows
this rule exists to keep. [Rule 12][12] records the same gap on the direct sign-up side.

**The window is never asked on its own.** `getLotterySignupEnded` derives it from the program item's
current start time, so one lotteried at an early slot and then moved to a later one would read as
waiting for a lottery that is behind it. A move is the only one of the changes above that can reopen
a closed window, the rest leaving the time it is derived from alone. So each automatic removal asks
the lottery's mark beside the window: `lotteryRanForStartTime` records that a run decided the
program item, and is left out of the import's update so a programme change cannot clear it.

The run's own removal goes by the mark alone. The sign-ups it takes from the attendees it places are
picked by start time, so a program item another run has already decided is what it has to recognize,
and the mark is what says so.

## 14. An event log item is never deleted, and what it says never changes

The event log and the emails are two views of the same story, and an email cannot be edited or
recalled once it is queued. So an item is written once and left to stand: not reworded later, not
deleted to tidy up. Anything else lets the two records disagree, and the inbox is the one Konsti
cannot fix.

The rule is about the message, so `isSeen` falls outside it - marking a notification read changes
nothing the item says, and has no counterpart in the inbox to disagree with.

This holds for every event log item, not only the lottery's, and each source reaches "once" its own
way. The lottery's rests on a start time being decided once ([rule 6][6]). The programme's cannot: the
import re-reads the whole programme every time it runs, so a cancellation, a deletion, a sign-up
type change and a move are each found by comparing the incoming programme against the stored one,
and are announced on the import that changes them rather than on every import after it. The lottery
sign-up cleanup compares nothing - it re-classifies every sign-up each time - and stays quiet only
because it removes the sign-up in the same pass that announces it. So a new event log write has to
do one or the other: announce a change it can recognize as new, or announce the removal of the
thing that would otherwise make it announce again. One that announces something it keeps would
append the same item on every import, for good, since nothing here may delete one.

**The rule covers the item, not the sentence the attendee reads.** A placement stores a program item
and a start time, and the event log page resolves the title, the program type, the hour and the
location from the programme as it stands when the page is opened - so a rename or a reschedule
changes what the attendee reads there, the email keeps the title it was queued with, and a deleted
program item leaves an entry saying only that it is gone. That is deliberate: the entry is a way
back to something they can still open, and last week's title would serve them worse than today's. A
rejection has no program item to point at, so it stores everything its sentence needs - the span and
the program type - and reads the same forever.

**Appended, never written back.** An item is added by a targeted append to the one attendee's log,
and nothing writes an attendee document back over the field: the programme cleanup reads whole
attendees and saves them again, but names the fields it means to change rather than storing what it
read. Saving the whole document would drop any item written between the read and the write,
silently and with nothing to see afterwards. Keeping the log out of those writes is what holds the
first half of this rule.

**The retry is the exception, and it is not fully honoured - a gap rather than a decision.** An
attempt that saved its spots and failed before marking them may be run again, and the second
attempt cannot tell who the first one already turned down. A winner is safe: their spot is on disk,
so the run reads it back and stays quiet. A rejection leaves nothing to read - a lottery sign-up
that lost looks exactly like one still waiting - so everyone the first attempt rejected gets a
second `NO_ASSIGNMENT` item and a second email, both permanent under this rule.

Closing that means giving the loser side something durable to check, which the event log already is:
skip an attendee who already carries a `NO_ASSIGNMENT` for this start time. Matching it is the
fiddly part, since a rejection stores the span its own attempt covered and that shifts if a program
item was cancelled or moved between the two. The times to compare against are the run's own hour
together with the hours its program items start, which is how the first-time bonus already
recognizes work of its own ([rule 4][4]). Until it does, the duplicate rejection is the known price of
being able to retry at all.

One consequence worth knowing: because the log is history rather than current state, a placement
recorded in it still counts as one after the attendee has given the spot up. The first-time bonus
reads it that way, and [rule 4][4] sets out what that costs them and what it does not.

## 15. Every lottery that ran is recorded, whatever it placed

A lottery run that put at least one program item through a lottery writes to the results collection,
and it writes **even when it placed nobody** - that is a real outcome and the record says so. A run
that lotteried nothing writes nothing: the lottery runs on a timer, so most start times have nothing
for it to do, and recording those would bury the real results under empty ones.

**The record is written last, so a lottery that ran can be missing from it.** It goes in after the
spots are saved, and like everything after that write it logs its own failure rather than failing
the run ([rule 6][6]) - the alternative is calling a lottery that placed people a failure over its
bookkeeping. A start time whose program items were every one of them passed over for holding
sign-ups ([rule 7][7]) leaves nothing behind either, having lotteried nothing, and yet its attendees are
told they got no spot. A missing record is therefore the ordinary sign that no lottery ran there,
not proof of it.

One start time, one document. The collection is dumped and kept once the event is over, and it is
the only account of the runs themselves: which algorithm decided a start time, what it reported, the
groups as they stood while it ran, and which run placed whom. What each attendee got survives in the
sign-ups too ([rule 13][13]), where a lottery win is a sign-up carrying the preference it was won at
rather than a first-come one.

A start time decided by two attempts still gets one record: an attempt that saved its spots and
failed before marking them can be run again ([rule 6][6]), and the second attempt skips the program items
the first one filled, so replacing the document would drop the first attempt's placements from the
record for good. The placements are therefore merged, and where both attempts name the same attendee
the later one stands - the lottery leaves an attendee one spot at a start time ([rule 10][10]), so the
second placement of them is a correction rather than a second spot. The run's own summary - its
algorithm, its message, its group snapshot - describes the most recent attempt rather than the pair,
since those are properties of a run and not of the start time.

Attendees see a filtered view of this: `/dashboard` lists only runs that placed somebody, since a
run that placed nobody has nothing for them to read. The filter belongs to the dashboard, not to
what gets stored - the record is kept either way.

## Known gaps

Where the code does not yet do what a rule says. Each is set out in full under its own rule, with
what closing it would take.

- [Rule 1][1] - the write that makes a lottery sign-up never asks whether the lottery allocates the
  program item at all.
- [Rule 4][4] - the spot half of the bonus never asks whether the program item is still happening.
- [Rule 4][4] - a rejection is matched by its hour alone, which a batch can get wrong in both
  directions.
- [Rule 8][8] - the duplicate-priority check asks the program item's own hour, so a batch can be
  entered carrying several first preferences.
- [Rule 9][9] - having been open is nowhere recorded, so only a program item the lottery has
  finished with keeps its direct sign-up open.
- [Rule 11][11] - the lottery sign-up form's warning names a single held spot where several are
  possible.
- [Rule 12][12] - hiding a program item removes the direct sign-ups it carries silently, and unhiding
  brings nothing back.
- [Rule 13][13] - hiding a program item removes the lottery sign-ups it carries whatever their
  lottery has done.
- [Rule 14][14] - a retried run sends a second rejection to everyone the first attempt turned down.

[1]: #1-an-always-open-program-item-sits-outside-the-lottery-entirely
[2]: #2-a-ranking-is-at-most-three-program-items-at-a-start-time-each-at-a-different-priority
[3]: #3-a-group-lands-in-one-program-item-or-none-of-it-does
[4]: #4-a-first-time-bonus-goes-to-attendees-who-hold-no-lottery-spot-yet
[5]: #5-a-program-item-is-filled-to-its-minimum-or-not-at-all
[6]: #6-the-lottery-for-a-start-time-happens-once
[7]: #7-a-program-item-is-empty-when-it-is-lotteried
[8]: #8-a-parent-start-time-decides-when-a-lottery-runs-not-where-the-attendee-is
[9]: #9-direct-sign-up-once-open-stays-open
[10]: #10-a-spot-won-in-the-lottery-overwrites-one-the-attendee-already-holds-at-that-hour
[11]: #11-holding-a-direct-sign-up-does-not-keep-you-out-of-the-lottery
[12]: #12-a-direct-sign-up-is-never-deleted-automatically-unless-keeping-it-would-be-incoherent
[13]: #13-a-lottery-sign-up-is-never-deleted-once-its-lottery-has-run
[14]: #14-an-event-log-item-is-never-deleted-and-what-it-says-never-changes
[15]: #15-every-lottery-that-ran-is-recorded-whatever-it-placed
