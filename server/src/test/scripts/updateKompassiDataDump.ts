import fs from "node:fs";
import { sortBy } from "lodash-es";
import prettier from "prettier";
import { getProgramFromServer } from "server/kompassi/getProgramItemsFromKompassi";
import { KompassiProgramItem } from "server/kompassi/kompassiProgramItem";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { logger } from "server/utils/logger";
import { config } from "shared/config";

const updateKompassiDataDump = async (): Promise<void> => {
  const { eventName, eventYear } = config.event();

  const kompassiProgramItems = unsafelyUnwrap(
    await getProgramFromServer(),
  ) as KompassiProgramItem[];

  const formattedKompassiProgramItems = sortBy(
    kompassiProgramItems.map((kompassiProgramItem) => ({
      ...kompassiProgramItem,
      cachedHosts: "<redacted>",
      scheduleItems: sortBy(
        kompassiProgramItem.scheduleItems,
        (scheduleItem) => scheduleItem.slug,
      ),
    })),
    [(programItem) => programItem.slug],
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
