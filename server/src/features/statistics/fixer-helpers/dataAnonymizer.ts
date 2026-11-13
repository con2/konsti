import { faker } from "@faker-js/faker";
import { ProgramItem } from "shared/types/models/programItem";
import { User } from "shared/types/models/user";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import { readJson, writeJson } from "server/features/statistics/statsUtil";
import { logger } from "server/utils/logger";

export const anonymizeData = async (
  event: string,
  year: number,
): Promise<void> => {
  const users = readJson<User>(event, year, "users");
  const directSignups = readJson<DirectSignupsForProgramItem>(
    event,
    year,
    "direct-signups",
  );
  const programItems = readJson<ProgramItem>(event, year, "program-items");

  // A generated name must never collide with another account (random draws alone have
  // produced duplicate usernames in past dumps)
  const usedUsernames = new Set(users.map((user) => user.username));
  const nextUsername = (): string => {
    let candidate = faker.number.int(1000000).toString();
    while (usedUsernames.has(candidate)) {
      candidate = faker.number.int(1000000).toString();
    }
    usedUsernames.add(candidate);
    return candidate;
  };

  for (const user of users) {
    const randomUsername = nextUsername();
    logger.info(`users.json: ${user.username} -> ${randomUsername}`);
    user.username = randomUsername;
    // Kompassi login users have no local password
    user.password =
      user.password === "" || user.kompassiId !== "" ? "" : "<redacted>";
    user.kompassiId = user.kompassiId === "" ? "" : "<redacted>";
    user.email = user.email === "" ? "" : "<redacted>";
  }

  for (const signup of directSignups) {
    for (const userSignup of signup.userSignups) {
      // Remove sign-up message answers
      if (userSignup.message !== "") {
        userSignup.message = "<redacted>";
      }
    }
  }

  for (const programItem of programItems) {
    programItem.people = "<redacted>";
  }

  await writeJson(event, year, "users", users);
  await writeJson(event, year, "direct-signups", directSignups);
  await writeJson(event, year, "program-items", programItems);
};
