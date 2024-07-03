import fs from "fs";
import prettier from "prettier";
import { getProgramFromServer } from "server/kompassi/getProgramItemsFromKompassi";
import { KompassiProgramItem } from "server/kompassi/kompassiProgramItem";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { logger } from "server/utils/logger";
import { config } from "shared/config";

const updateKompassiDataDump = async (): Promise<void> => {
  const { conventionName, conventionYear } = config.shared();

  const kompassiProgramItems = unsafelyUnwrap(
    await getProgramFromServer(),
  ) as KompassiProgramItem[];

  const formattedKompassiProgramItems = kompassiProgramItems.map(
    (kompassiProgramItem) => ({
      ...kompassiProgramItem,
      cachedHosts: "<redacted>",
    }),
  );

  fs.writeFileSync(
    `src/test/kompassi-data-dumps/program-${conventionName}-${conventionYear}.json`,
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
