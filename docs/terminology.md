# Terminology

A plain-language glossary of Konsti terms.

## Users

- **User** — a registered account used to sign up to program items.
- **Admin** — a user who manages the event in Konsti.
- **Helper** — a shared account used by desk volunteers to help attendees at the event in person.
- **Registration code** — a short unique code attached to each user. Some events require one at registration; helpers use it to find users.
- **Kompassi account** — an external identity from Kompassi OAuth. Some events let users log in with their Kompassi account instead of a local password.

## Program items

- **Program item** — the thing users sign up to (e.g. a roleplaying session or a tournament).
- **Program type** — the category a program item belongs to (e.g. tabletop rpg, larp).
- **Spot** — one attendee slot in a program item.
- **Attendee** — a person who has a spot in a program item. Sometimes called "player" (for rpg/larp) or "participant" (for other types).
- **Favorite** — a "watch this" bookmark on a program item.
- **Revolving door** — a program item users can drop in and out of freely whenever there's space.
- **Entry condition** — something a user must acknowledge before signing up, e.g. an age requirement like K16 or an entry/material fee.
- **Popularity** — a low-to-extreme indicator of how popular a program item is. Derived from a continuous background simulation of the lottery.

### How a program item can "go away"

- **Cancelled** — the item is marked as cancelled but stays visible, so users know it was cancelled.
- **Deleted** — the item is removed from the database entirely, along with its signups and favorites.
- **Hidden** — hidden by an admin so users can't see it. The item is still in the database.

## Events

- **Event** — a convention (e.g. Ropecon, Tracon).
- **Event config** — per-event static configuration (e.g. active program types, lottery algorithm).
- **Settings** — runtime settings an admin can change while the event is running (e.g. whether the app is open, which login provider is allowed).
- **Kompassi** — an event management system Konsti imports program items from, and optionally uses for login.

## Signups

- **Lottery signup** — a weighted preference submitted before the lottery runs. The user picks up to three program items and ranks them.
- **Direct signup** — a first-come-first-served seat grab. The user can leave a message if the organizer asked a signup question. Some program items only offer direct signup; others offer it after the lottery.
- **Priority** — the rank a user gave a program item in their lottery signups (1, 2, or 3).
- **Signup question** — an organizer-defined question attached to a program item, which the user answers when signing up. A public signup question's answers are visible to other Konsti users; a private one's answers are visible only to helpers (useful for contact info on tournaments and similar).
- **Two-phase signup** — the flow where lottery runs first and then leftover spots open up for direct signup. This applies only to certain program types (typically rpgs and larps).
- **Phase gap** — in a two-phase signup, the pause between the lottery closing and direct signup opening. Gives users a moment to see their results before competing for leftover spots.

## Assignment

- **Assignment** — the step that allocates spots to users based on lottery signups. Called "lottery" in user-facing contexts, since that's a more familiar word.
- **Auto-assignment** — the scheduled cron run that kicks off assignment automatically as each lottery phase closes. This is the normal path; admins only trigger assignment manually as a backup.
- **Assignment algorithm** — the algorithm that decides who gets which spot. Konsti supports two, plus a combined mode:
  - **PADG** — a preference-based algorithm.
  - **Random** — a randomized algorithm.
  - **PADG + Random** — runs both and keeps whichever result scores better.
- **First signup bonus** — a boost given to users (or groups) who haven't yet been assigned to any program item at the event, with an extra boost on top for those who lost earlier lotteries. Helps give everyone a fair shot across the event.

## Groups

- **Group** — several users who enter the lottery together to be assigned to the same program item.
- **Group creator** — the user who made the group. Only the creator can submit lottery signups or close the group. Members inherit the creator's signups.
- **Group code** — a shared code created when a group is formed, used to join the group.

## Notifications

- **Event log** — the per-user notification feed. Also called "Notifications".
- **Email notification** — an optional email sent when the user gets (or doesn't get) a spot in the lottery. Users choose which outcomes they want emails for.
