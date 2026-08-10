# Datafiles Guide

This directory contains sanitized database dumps from Konsti events. The data can be used for calculating statistics about sign-ups, lottery results, and user behavior.

Data files are located in [`server/src/features/statistics/datafiles/`](../../server/src/features/statistics/datafiles/).

## Directory Structure

```
datafiles/{event}/{year}/
```

Events: `ropecon`, `tracon`, `tracon-hitpoint`, `solmukohta`

## Files

Entries in every file also carry `createdAt` and `updatedAt` timestamps. They are database metadata and omitted from the examples below.

### direct-signups.json

Confirmed sign-ups (both lottery-assigned and direct sign-ups).

```jsonc
[
  {
    "programItemId": "example-program",
    "userSignups": [
      {
        "username": "123456",
        "priority": 1, // See "Priority values" below
        "signedToStartTime": "2024-07-19T15:00:00Z",
        "signupTime": "2024-07-17T18:34:56.789Z", // When the sign-up was stored, see below
        "message": "",
      },
    ],
    "count": 5, // Number of sign-ups
  },
]
```

A handful of historical entries are overfilled (more sign-ups than the program's `maxAttendance`; 11 items and 20 excess sign-ups across 2017-2025, of which 6 items and 11 sign-ups are tabletop RPGs).

**Priority values:**

- `0` - Signed up via direct sign-up (first-come-first-served)
- `1` - Got their 1st lottery choice
- `2` - Got their 2nd lottery choice
- `3` - Got their 3rd lottery choice

**`signupTime` values:** Ropecon 2026 is the first event where `signupTime` is the actual recorded sign-up moment. For earlier events (2017-2025) the field was backfilled during normalization: direct sign-ups (`priority: 0`) use the program's start time, and lottery-assigned sign-ups (priority > 0) use two hours before the assigned slot, which is when the assignment run happened - except in the Tracon 2024 and 2025 dumps, where lottery-assigned rows use the slot time itself.

2017-2019 events were lottery-only, so all of their entries use `priority` 1-3; Ropecon 2021 ran direct sign-up only (remote / COVID convention), so all of its entries use `priority: 0`.

**Tracon Hitpoint 2019:** this file only holds each user's chronologically last lottery win, even though `results.json` shows users winning up to three spots. Use `results.json` for anything involving per-user spot counts.

### program-items.json

All program items for the event.

```jsonc
[
  {
    "programItemId": "example-program",
    "title": "Example Program",
    "parentId": "example-program", // Kompassi parent program id shared by multi-session items; present from Tracon 2025 onward
    "programType": "tabletopRPG", // tabletopRPG, larp, workshop, tournament, otherGaming, fleaMarket, other
    "signupType": "konsti", // Items not using Konsti sign-up have notRequired, other, ropelarp, or experiencePoint
    "state": "accepted", // "cancelled" if the program was cancelled
    "startTime": "2024-07-19T12:00:00Z",
    "endTime": "2024-07-19T16:00:00Z",
    "mins": 240,
    "minAttendance": 1,
    "maxAttendance": 4, // 0 only on items that do not use Konsti sign-up
    "location": "Sali 306",
    "languages": ["finnish", "english"],
    "gameSystem": "Torchbearer",
    "genres": [],
    "styles": ["light", "characterDriven"],
    "tags": ["beginnerFriendly"],
    "ageGroups": ["adults"],
    "popularity": "medium", // notSet, low, medium, high, veryHigh, extreme - see "Popularity scale history" below
    "revolvingDoor": true, // Players can join/leave mid-session
    "description": "...",
    "shortDescription": "...",
    "people": "<redacted>", // Organizer names (redacted)
    "otherAuthor": "", // Author credit for the original work, not redacted
    "entryFee": "",
    "contentWarnings": "...",
    "accessibilityValues": ["loudSounds", "noMovement"],
    "otherAccessibilityInformation": "",
  },
]
```

### results.json

Lottery assignment run results. Each entry represents one assignment run (the lottery runs multiple times during an event, once per sign-up time slot).

```jsonc
[
  {
    "assignmentTime": "2024-07-19T15:00:00Z", // The start time slot being assigned
    "algorithm": "padg", // "padg", "random" or both
    "message": "Padg Assignment Result - Attendees: 41/85 (48%), Program items: 9/9 (100%)",
    "results": [
      {
        "username": "123456",
        "assignmentSignup": {
          "programItemId": "example-program",
          "priority": 2, // Which preference (1st, 2nd, 3rd) was assigned
          "signedToStartTime": "2024-07-19T15:00:00Z",
        },
      },
    ],
    "groups": [
      // Snapshot of the groups that took part in this lottery run
      {
        "groupCode": "abc-def-ghi",
        "groupCreator": "123456", // Username of the group creator
        "groupMembers": ["123456", "654321"], // All members, creator included
      },
    ],
  },
]
```

The same assignment data is also reflected in `direct-signups.json` (with priority > 0). This file provides the additional context of which algorithm was used and the assignment run metadata.

From Ropecon 2026 onward, `groups` is a live snapshot recorded when the run happened. For older events the field was added after they ran, so it is backfilled per run from each event's final `users.json` state: a group is included when its creator had a lottery sign-up for the run's start time or one of its members won in that run. Backfilled group membership reflects the dump's final state, which may differ from the moment the lottery actually ran. In Ropecon 2018, 12 of the 189 backfilled group snapshots have an empty `groupCreator` (`""`) because the creator could not be reconstructed; those groups were included via a member's win.

**Wins can reference program items missing from `program-items.json`:** items deleted after their lottery keep their result rows even though the live cleanup removes every user-side reference. Joining `results.json` to `program-items.json` on `programItemId` drops these rows: 9 in Tracon Hitpoint 2023, 6 in Tracon Hitpoint 2024, and 5 in Ropecon 2026.

A win's `signedToStartTime` always equals its run's `assignmentTime`, except for Tracon 2025's parent-batched flea-market rows, where one run assigns several sequential sub-slots.

Ropecon 2021 has no `results.json` because no lottery was run that year (remote / COVID convention, direct sign-up only).

### users.json

All users with sanitized data. Usernames are anonymized numeric IDs, unique within each dump but randomized per event, so the same person cannot be tracked across events. `password` is `"<redacted>"` when the account had a password and `""` for accounts that never had one (Kompassi login users).

In Ropecon 2023-2024 and Tracon 2024, a handful of direct sign-up rows (12 in total) may be attached to the wrong one of two accounts: an earlier anonymization defect merged the accounts' rows, and these direct sign-ups could not be re-attributed with certainty.

```jsonc
[
  {
    "kompassiId": "", // See "kompassiId values" below
    "kompassiUsernameAccepted": false, // true once a Kompassi login user has accepted their Konsti username
    "username": "123456",
    "password": "<redacted>", // "" if the account never had a password
    "userGroup": "user", // Always "user" in dumps (admins excluded)
    "serial": "1001408788", // Registration code used to create the account
    "groupCode": "0", // "0" = not in a group, otherwise a group code
    "isGroupCreator": false, // true if the user created the group
    "favoriteProgramItemIds": ["program-id-1", "program-id-2"],
    "lotterySignups": [
      // What the user submitted to the lottery
      {
        "programItemId": "example-program",
        "priority": 1, // User's preference order (1 = first choice)
        "signedToStartTime": "2024-07-19T15:00:00Z",
      },
    ],
    "eventLogItems": [
      // Notifications shown to the user
      {
        "action": "newAssignment", // newAssignment, noAssignment, programItemCancelled, programItemDeleted, programItemMoved
        "programItemId": "example-program",
        "programItemStartTime": "2024-07-19T15:00:00Z",
        "isSeen": true,
        "createdAt": "2024-07-19T13:00:08.123Z",
      },
    ],
    "email": "<redacted>", // "" if not provided; present from Tracon 2025 onward
    "emailNotificationPermitAsked": false, // Present from Tracon 2025 onward
  },
]
```

**Caveat: `lotterySignups` can be incomplete.** Lottery sign-ups may be removed after the lottery has run: before Ropecon 2026 joining a group deleted the user's sign-ups for already-run lotteries (2026 onward preserves them), winning a spot removes other lottery sign-ups according to the event's `removeLotterySignupsStrategy` (overlapping sign-ups for most events, all upcoming ones in Tracon 2025, none in Tracon 2024), and program items moved or deleted after a run erase the matching sign-ups. `eventLogItems` are never modified. This means some users have `newAssignment` or `noAssignment` entries for program items or time slots that no longer appear in their `lotterySignups`. To reconstruct what users originally wanted, treat `eventLogItems` as authoritative evidence of past lottery participation and combine it with the remaining `lotterySignups`.

### serials.json

Generated registration codes. Not required for statistics.

### settings.json

Application settings dump. Not required for statistics.

## Conventions to know

- **Group creator identification**: a user is the group creator iff `user.isGroupCreator === true` (a creator's `groupCode` is the group's own code). Regular members have `isGroupCreator: false`. In 2018-2023 dumps the `groupCode` equals the creator's `serial`; from 2024 onward it's an unrelated UUID-style string.
- **`kompassiId` values**: always a string. `""` means the user signed up with a registration code; `"<redacted>"` means they used a Kompassi account. Both forms only co-exist in events whose `settings.json` has `loginProvider: "local+kompassi"` (Ropecon 2025 onward). Earlier events have a single value across all rows depending on the active login method. This matches the live DB, which stores the Kompassi OIDC `sub` claim, or `""` for a local account.
- **Popularity scale history**: Ropecon 2025 introduced the 5-bucket enum (`notSet`/`low`/`medium`/`high`/`veryHigh`/`extreme`). Pre-2025 dumps used a numeric scale that encoded only 3 buckets (`low` = under min attendance, `medium` = between min and max, `high` = at max), so normalized older dumps never carry `veryHigh` or `extreme`.
- **Algorithm naming history**: `results.json` `algorithm` field is canonicalized to current names. `Opa` (in older `message` strings) was the older name for `padg`; `Group` was the older name for `random`. 2017 used `hungarian` (no longer in the codebase enum), and 2018 used `random`.
- **Past-event configs**: [`shared/config/past-events/`](../../shared/config/past-events/) holds a `Partial<EventConfig>` per event. Files for 2017-2022 (Ropecon) and 2019 (Tracon Hitpoint) were reconstructed from the data files (not preserved from the live event) and carry a notice header.

## Tips for Analysis

- **Sign-up success rate**: Compare `users.json` `lotterySignups` (what users wanted) against `direct-signups.json` or `results.json` (what they got). Users with `eventLogItems` action `"noAssignment"` did not get a spot.
- **Program popularity**: Count lottery sign-ups per program item across all users, or compare `maxAttendance` vs actual sign-up count in `direct-signups.json`.
- **Lottery preference satisfaction**: In `direct-signups.json` or `results.json`, check how many users got their 1st choice (priority 1) vs 2nd or 3rd.
- **Group sign-ups**: Users with matching non-zero `groupCode` in `users.json` signed up as a group and were assigned together.
- **Filter cancelled programs**: Exclude program items where `state` is `"cancelled"` in `program-items.json`.
- **Join data**: Use `programItemId` to join between files, and `username` to join users with their sign-ups and results.
