import { execSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { mongoDbImage, mongoDbVersion } from "server/test/mongoDbVersion";
import { logger } from "server/utils/logger";
import { runScript } from "server/utils/runScript";

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

const getContainerLogs = (): string => {
  try {
    // A crashing container writes to stderr, which `docker logs` replays on its own stderr
    return execSync(`docker logs --tail 20 ${containerName} 2>&1`, {
      stdio: "pipe",
    })
      .toString()
      .trim();
  } catch {
    return "(logs unavailable)";
  }
};

const assertContainerStillRunning = async (): Promise<void> => {
  await sleep(stabilityCheckMs);
  if (isMongoContainerRunning()) {
    return;
  }
  const exitCode = inspect("{{.State.ExitCode}}") ?? "unknown";
  logger.error(
    new Error(
      `Docker: MongoDB container ${containerName} exited shortly after start (exit code ${exitCode}). Last logs:\n${getContainerLogs()}`,
    ),
  );
  process.exitCode = 1;
};

const main = async (): Promise<void> => {
  logger.info(
    `Docker: Start new container ${containerName} or connect to existing`,
  );
  if (isMongoContainerRunning()) {
    logger.info("Docker: MongoDB container is already running, connecting...");
  } else if (doesMongoContainerExist()) {
    logger.info("Docker: Starting existing MongoDB container...");
    execSync(`docker start ${containerName}`, { stdio: "inherit" });
  } else {
    logger.info("Docker: Running new MongoDB container...");
    execSync(
      `docker run -p 27017:27017 -d --name ${containerName} ${mongoDbImage}`,
      {
        stdio: "inherit",
      },
    );
  }
  await assertContainerStillRunning();
};

await runScript("Docker: Failed to start MongoDB container", main);
