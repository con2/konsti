import { execSync } from "node:child_process";
import { logger } from "server/utils/logger";

const mongoDbVersion = "8.0.10";
const containerName = `konsti-mongodb-${mongoDbVersion}`;

const isMongoContainerRunning = (): boolean => {
  try {
    const output = execSync(
      `docker inspect -f "{{.State.Running}}" ${containerName}`,
      {
        stdio: "pipe",
      },
    )
      .toString()
      .trim();
    return output === "true";
  } catch {
    return false;
  }
};

const doesMongoContainerExist = (): boolean => {
  try {
    execSync(`docker inspect ${containerName}`, {
      stdio: "pipe",
    });
    return true;
  } catch {
    return false;
  }
};

try {
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
} catch (error) {
  logger.error("Failed to start MongoDB container: %s", error);
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1);
}
