import { genLotterySignups } from "server/features/statistics/doc-generators/genLotterySignups";
import { genLotteryWinsPerUser } from "server/features/statistics/doc-generators/genLotteryWinsPerUser";
import { genRpgCounts } from "server/features/statistics/doc-generators/genRpgCounts";
import { genRpgFillRate } from "server/features/statistics/doc-generators/genRpgFillRate";
import { genRpgPlayers } from "server/features/statistics/doc-generators/genRpgPlayers";
import { genRpgStartTimes } from "server/features/statistics/doc-generators/genRpgStartTimes";
import {
  datafileViolations,
  unknownEventDirs,
} from "server/features/statistics/doc-generators/statsUtils";

const generateDocs = (): void => {
  const unknown = unknownEventDirs();
  if (unknown.length > 0) {
    // eslint-disable-next-line no-restricted-syntax -- Stats doc generation script
    throw new Error(
      `Datafile events missing from EVENT_ORDER: ${unknown.join(", ")}`,
    );
  }
  const violations = datafileViolations();
  if (violations.length > 0) {
    // eslint-disable-next-line no-restricted-syntax -- Stats doc generation script
    throw new Error(`Datafile invariant violations: ${violations.join("; ")}`);
  }
  genRpgCounts();
  genRpgStartTimes();
  genRpgPlayers();
  genRpgFillRate();
  genLotterySignups();
  genLotteryWinsPerUser();
};

generateDocs();
