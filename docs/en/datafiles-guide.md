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

Confirmed signups (both lottery-assigned and first-come-first-served).

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

- `0` — Signed up via first-come-first-served
- `1` — Got their 1st lottery choice
- `2` — Got their 2nd lottery choice
- `3` — Got their 3rd lottery choice

Not available for older events (2017-2021). For those years, confirmed signups are in `users.json` under `directSignups`.

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

Older events (2017-2019) include an additional `lotterySignups` array per result entry showing all the user's preferences for that time slot.

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
        "message": "",
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

**Caveat: `lotterySignups` can be incomplete.** Lottery signups may be removed after the lottery has run (e.g. the user joins a group), but `eventLogItems` are never modified. This means some users have `newAssignment` or `noAssignment` entries for program items or time slots that no longer appear in their `lotterySignups`. To reconstruct what users originally wanted, treat `eventLogItems` as authoritative evidence of past lottery participation and combine it with the remaining `lotterySignups`.

Older events (2017-2019) have a slightly different schema:

- `directSignups` array (confirmed signups are embedded in users, no separate `direct-signups.json`)
- `favoriteProgramItemIds` is an array of objects `{programItemId}` instead of plain strings

### serials.json

Generated registration codes. Not required for statistics.

### settings.json

Application settings dump. Not required for statistics.

## Tips for Analysis

- **Signup success rate**: Compare `users.json` `lotterySignups` (what users wanted) against `direct-signups.json` or `results.json` (what they got). Users with `eventLogItems` action `"noAssignment"` did not get a spot.
- **Program popularity**: Count lottery signups per program item across all users, or compare `maxAttendance` vs actual signup count in `direct-signups.json`.
- **Lottery preference satisfaction**: In `direct-signups.json` or `results.json`, check how many users got their 1st choice (priority 1) vs 2nd or 3rd.
- **Group signups**: Users with matching non-zero `groupCode` in `users.json` signed up as a group and were assigned together.
- **Filter cancelled programs**: Exclude program items where `state` is `"cancelled"` in `program-items.json`.
- **Join data**: Use `programItemId` to join between files, and `username` to join users with their signups and results.
