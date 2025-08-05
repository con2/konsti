import fs from "node:fs";
import { sortBy } from "remeda";
import prettier from "prettier";
import { getProgramFromServer } from "server/kompassi/getProgramItemsFromKompassi";
import { KompassiProgramItem } from "server/kompassi/kompassiProgramItem";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { logger } from "server/utils/logger";
import { config } from "shared/config";

const isPlainObject = (val: unknown): val is Record<string, unknown> => {
  return (
    typeof val === "object" &&
    val !== null &&
    !Array.isArray(val) &&
    Object.prototype.toString.call(val) === "[object Object]"
  );
};

const deepSortArrays = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    const sorted = value.map((element) => deepSortArrays(element));
    return sortBy(sorted, (val) =>
      typeof val === "number" || typeof val === "string" ? val : String(val),
    );
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [key, deepSortArrays(val)]),
    );
  }

  return value;
};

const updateKompassiDataDump = async (): Promise<void> => {
  const { eventName, eventYear } = config.event();

  const kompassiProgramItems = unsafelyUnwrap(await getProgramFromServer());

  const sortedKompassiProgramItems = deepSortArrays(
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
    // eslint-disable-next-line no-restricted-syntax -- TODO: Fix, format() ban should only apply to dayjs().format()
    await prettier.format(JSON.stringify(formattedKompassiProgramItems), {
      parser: "json",
    }),
    "utf8",
  );
};

updateKompassiDataDump().catch((error: unknown) => {
  logger.error("%s", error);
});
