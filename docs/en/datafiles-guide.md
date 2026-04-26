# Datafiles Guide

This directory contains sanitized database dumps from Konsti events. The data can be used for calculating statistics about signups, lottery results, and user behavior.

Data files are located in [`server/src/features/statistics/datafiles/`](../../server/src/features/statistics/datafiles/).

## Directory Structure

```
datafiles/{event}/{year}/
```

Events: `ropecon`, `tracon`, `tracon-hitpoint`, `solmukohta`

## Files

### direct-signups.json

Confirmed signups (both lottery-assigned and direct signups).

```jsonc
[
  {
    "programItemId": "example-program",
    "userSignups": [
      {
        "username": "123456",
        "priority": 1, // See "Priority values" below
        "signedToStartTime": "2024-07-19T15:00:00Z",
        "message": "",
      },
    ],
    "count": 5, // Number of signups
  },
]
```

**Priority values:**

- `0` — Signed up via direct signup (first-come-first-served)
- `1` — Got their 1st lottery choice
- `2` — Got their 2nd lottery choice
- `3` — Got their 3rd lottery choice

For older events (2017–2021) this file was reconstructed from `users.json` `directSignups` during a normalization pass. Entries from 2017–2019 use `priority: 1`, `2`, or `3` matching the lottery preference that won (Konsti was lottery-only then, so every confirmed signup was a lottery win). For 2017–2018 the priority was not stored on the original `directSignups` entries and was looked up from `results.json`; for 2019 it was already present. Ropecon 2021 was a remote / COVID-era convention that ran direct signup only (no lottery), so its entries use `priority: 0`.

### program-items.json

All program items for the event.

```jsonc
[
  {
    "programItemId": "example-program",
    "title": "Example Program",
    "programType": "tabletopRPG", // tabletopRPG, larp, workshop, tournament, other
    "signupType": "konsti",
    "state": "accepted", // "cancelled" if the program was cancelled
    "startTime": "2024-07-19T12:00:00Z",
    "endTime": "2024-07-19T16:00:00Z",
    "mins": 240,
    "minAttendance": 1,
    "maxAttendance": 4, // 0 = no limit
    "location": "Sali 306",
    "languages": ["finnish", "english"],
    "gameSystem": "Torchbearer",
    "genres": [],
    "styles": ["light", "characterDriven"],
    "tags": ["adults", "beginnerFriendly"],
    "popularity": 0,
    "revolvingDoor": true, // Players can join/leave mid-session
    "description": "...",
    "shortDescription": "...",
    "people": "<redacted>", // Organizer names (redacted)
    "entryFee": "",
    "contentWarnings": "...",
    "accessibilityValues": ["loudSounds", "noMovement"],
    "otherAccessibilityInformation": "",
  },
]
```

### results.json

Lottery assignment run results. Each entry represents one assignment run (the lottery runs multiple times during an event, once per signup time slot).

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
  },
]
```

The same assignment data is also reflected in `direct-signups.json` (with priority > 0). This file provides the additional context of which algorithm was used and the assignment run metadata.

Ropecon 2021 has no `results.json` because no lottery was run that year (remote / COVID convention, direct signup only).

### users.json

All users with sanitized data. Usernames are anonymized numeric IDs, passwords are redacted.

```jsonc
[
  {
    "username": "123456",
    "userGroup": "user", // Always "user" in dumps (admins excluded)
    "serial": "1001408788", // Registration code used to create the account
    "groupCode": "0", // "0" = not in a group, otherwise a group code
    "groupCreatorCode": "0", // "0" = not a group creator
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
        "action": "newAssignment", // "newAssignment" or "noAssignment"
        "programItemId": "example-program",
        "programItemStartTime": "2024-07-19T15:00:00Z",
        "isSeen": true,
        "createdAt": "2024-07-19T13:00:08.123Z",
      },
    ],
  },
]
```

**Caveat: `lotterySignups` can be incomplete.** Lottery signups may be removed after the lottery has run (e.g. the user joins a group), but `eventLogItems` are never modified. This means some users have `newAssignment` or `noAssignment` entries for program items or time slots that no longer appear in their `lotterySignups`. To reconstruct what users originally wanted, treat `eventLogItems` as authoritative evidence of past lottery participation and combine it with the remaining `lotterySignups`. For 2017–2018, signups that were wiped from `users.json` were restored during normalization from a per-result snapshot that older `results.json` files used to carry.

Older events have been normalized into the schema above. Notable details:

- 2017–2019 (Ropecon, Tracon Hitpoint 2019): `directSignups` were moved out into a generated `direct-signups.json`; `favoriteProgramItemIds` was flattened from `[{programItemId}]` to `[string]`; old descriptive boolean flags (`englishOk`, `childrenFriendly`, `ageRestricted`, `beginnerFriendly`, `intendedForExperiencedParticipants`) were mapped to entries in `tags` and removed; 2017's `attributes` array was split into `genres` and `styles` and removed; 2017's `notes` field (which contained the game system) was renamed to `gameSystem`.
- 2017: `mins` was string-typed and is now numeric; lottery signup priorities were string-typed and are now numeric; `signedToStartTime` was backfilled from each program's `startTime`.
- 2021 Ropecon: a remote / COVID-era convention with direct signup only — no lottery was run. `lotterySignups` is empty by design and `results.json` is absent. Confirmed signups are in `direct-signups.json` with `priority: 0`.

### serials.json

Generated registration codes. Not required for statistics.

### settings.json

Application settings dump. Not required for statistics.

## Conventions to know

- **Group creator identification**: a user is the group creator iff `user.groupCreatorCode === user.groupCode` (both non-`"0"`). Regular members have `groupCreatorCode: "0"`. In 2018–2023 dumps the `groupCode` equals the creator's `serial`; from 2024 onward it's an unrelated UUID-style string.
- **`kompassiId` types**: `0` (number) means the user signed up with a registration code; `"<redacted>"` (string) means they used Kompassi OAuth. Both forms only co-exist in events whose `settings.json` has `loginProvider: "local+kompassi"` (Ropecon 2025 onward). Earlier events have a single value across all rows depending on the active login method.
- **Popularity scale history**: Ropecon 2025 introduced the 5-bucket enum (`notSet`/`low`/`medium`/`high`/`veryHigh`/`extreme`). Pre-2025 dumps used a numeric scale that encoded only 3 buckets (`low` = under min attendance, `medium` = between min and max, `high` = at max), so normalized older dumps never carry `veryHigh` or `extreme`.
- **Algorithm naming history**: `results.json` `algorithm` field is canonicalized to current names. `Opa` (in older `message` strings) was the older name for `padg`; `Group` was the older name for `random`. 2017 used `hungarian` (no longer in the codebase enum), and 2018 used `random`.
- **Past-event configs**: [`shared/config/past-events/`](../../shared/config/past-events/) holds a `Partial<EventConfig>` per event. Files for 2017–2022 (Ropecon) and 2019 (Tracon Hitpoint) were reconstructed from the data files (not preserved from the live event) and carry a notice header.

## Tips for Analysis

- **Signup success rate**: Compare `users.json` `lotterySignups` (what users wanted) against `direct-signups.json` or `results.json` (what they got). Users with `eventLogItems` action `"noAssignment"` did not get a spot.
- **Program popularity**: Count lottery signups per program item across all users, or compare `maxAttendance` vs actual signup count in `direct-signups.json`.
- **Lottery preference satisfaction**: In `direct-signups.json` or `results.json`, check how many users got their 1st choice (priority 1) vs 2nd or 3rd.
- **Group signups**: Users with matching non-zero `groupCode` in `users.json` signed up as a group and were assigned together.
- **Filter cancelled programs**: Exclude program items where `state` is `"cancelled"` in `program-items.json`.
- **Join data**: Use `programItemId` to join between files, and `username` to join users with their signups and results.
