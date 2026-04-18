import { execSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { logger } from "server/utils/logger";

const mongoDbVersion = "8.0.20";
const containerName = `konsti-mongodb-${mongoDbVersion}`;
const stabilityCheckMs = 3000;

const inspect = (format: string): string | null => {
  try {
    return execSync(`docker inspect -f "${format}" ${containerName}`, {
      stdio: "pipe",
    })
      .toString()
      .trim();
  } catch {
    return null;
  }
};

const isMongoContainerRunning = (): boolean =>
  inspect("{{.State.Running}}") === "true";

const doesMongoContainerExist = (): boolean =>
  inspect("{{.State.Status}}") !== null;

const assertContainerStillRunning = async (): Promise<void> => {
  await sleep(stabilityCheckMs);
  if (isMongoContainerRunning()) {
    return;
  }
  const exitCode = inspect("{{.State.ExitCode}}") ?? "unknown";
  logger.error(
    `MongoDB container ${containerName} exited shortly after start (exit code ${exitCode}). Last logs:`,
  );
  try {
    execSync(`docker logs --tail 20 ${containerName}`, { stdio: "inherit" });
  } catch {
    // logs unavailable — already reported the exit
  }
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1);
};

const main = async (): Promise<void> => {
  logger.info(`Start new container ${containerName} or connect to existing`);
  if (isMongoContainerRunning()) {
    logger.info("MongoDB container is already running, connecting...");
  } else if (doesMongoContainerExist()) {
    logger.info("Starting existing MongoDB container...");
    execSync(`docker start ${containerName}`, { stdio: "inherit" });
  } else {
    logger.info("Running new MongoDB container...");
    execSync(
      `docker run -p 27017:27017 -d --name ${containerName} mongo:${mongoDbVersion}-noble`,
      {
        stdio: "inherit",
      },
    );
  }
  await assertContainerStillRunning();
};

main().catch((error: unknown) => {
  logger.error("Failed to start MongoDB container: %s", error);
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1);
});
