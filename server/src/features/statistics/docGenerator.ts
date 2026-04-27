import { initializeDayjs } from "shared/utils/initializeDayjs";
import { genLotterySignups } from "server/features/statistics/doc-generators/genLotterySignups";
import { genRpgCounts } from "server/features/statistics/doc-generators/genRpgCounts";
import { genRpgFillRate } from "server/features/statistics/doc-generators/genRpgFillRate";
import { genRpgPlayers } from "server/features/statistics/doc-generators/genRpgPlayers";
import { genRpgStartTimes } from "server/features/statistics/doc-generators/genRpgStartTimes";

const generateDocs = (): void => {
  initializeDayjs();
  genRpgCounts();
  genRpgStartTimes();
  genRpgPlayers();
  genRpgFillRate();
  genLotterySignups();
};

generateDocs();
