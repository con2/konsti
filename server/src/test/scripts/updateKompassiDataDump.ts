import fs from "node:fs";
import prettier from "prettier";
import { sortBy } from "remeda";
import { config } from "shared/config";
import { getProgramFromServer } from "server/kompassi/getProgramItemsFromKompassi";
import { KompassiProgramItem } from "server/kompassi/kompassiProgramItem";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { logger } from "server/utils/logger";

const isPlainObject = (val: unknown): val is Record<string, unknown> => {
  return (
    typeof val === "object" &&
    val !== null &&
    !Array.isArray(val) &&
    Object.prototype.toString.call(val) === "[object Object]"
  );
};

// Kompassi returns annotation keys in arbitrary order, so sort them to keep the dump stable
const sortAnnotationKeys = (value: unknown): unknown => {
  if (!isPlainObject(value)) {
    return value;
  }
  return Object.fromEntries(sortBy(Object.entries(value), ([key]) => key));
};

const deepSort = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    const sorted = value.map((element) => deepSort(element));
    return sortBy(sorted, (val) =>
      typeof val === "number" || typeof val === "string" ? val : String(val),
    );
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [
        key,
        deepSort(key === "cachedAnnotations" ? sortAnnotationKeys(val) : val),
      ]),
    );
  }

  return value;
};

const updateKompassiDataDump = async (): Promise<void> => {
  const { eventName, eventYear } = config.event();

  const kompassiProgramItems = unsafelyUnwrap(await getProgramFromServer());

  const sortedKompassiProgramItems = deepSort(
    kompassiProgramItems,
  ) as KompassiProgramItem[];

  const formattedKompassiProgramItems = sortBy(
    sortedKompassiProgramItems.map((kompassiProgramItem) => ({
      ...kompassiProgramItem,
      cachedHosts: "<redacted>",
      scheduleItems: sortBy(
        kompassiProgramItem.scheduleItems,
        (scheduleItem) => scheduleItem.slug,
      ),
    })),
    (programItem) => programItem.slug,
  );

  fs.writeFileSync(
    `src/test/kompassi-data-dumps/program-${eventName.toLocaleLowerCase()}-${eventYear}.json`,
    await prettier.format(JSON.stringify(formattedKompassiProgramItems), {
      parser: "json",
    }),
    "utf8",
  );
};

try {
  await updateKompassiDataDump();
} catch (error: unknown) {
  logger.error(error);
}
