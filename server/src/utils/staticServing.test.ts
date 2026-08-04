import fs from "node:fs";
import path from "node:path";
import { Server } from "node:http";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "vitest";
import request from "supertest";
import { faker } from "@faker-js/faker";
import { closeServer, startServer } from "server/utils/server";

// Same location the server serves from. The directory is a build output that
// doesn't exist in a fresh checkout, so the fixture files are created here and
// only the ones this suite created are removed afterwards
const staticPath = path.join(import.meta.dirname, "../../front");
// Shaped like a real bundler output name, i.e. with a content hash
const bundledAssetName = "cacheTest-Ab12Cd34.js";
// A static file served from the root. The hyphenated name is deliberate: it
// reads like a hashed name, so it catches a cache rule that guesses from the
// filename instead of the location
const staticFileName = "service-worker-registration.js";

const createdFiles: string[] = [];
const createdDirs: string[] = [];

const ensureDir = (dir: string): void => {
  if (fs.existsSync(dir)) {
    return;
  }
  fs.mkdirSync(dir);
  createdDirs.push(dir);
};

const ensureFile = (filePath: string, content: string): void => {
  if (fs.existsSync(filePath)) {
    return;
  }
  fs.writeFileSync(filePath, content);
  createdFiles.push(filePath);
};

beforeAll(() => {
  ensureDir(staticPath);
  ensureDir(path.join(staticPath, "assets"));
  ensureFile(path.join(staticPath, "index.html"), "<html></html>");
  ensureFile(path.join(staticPath, staticFileName), "export {};");
  ensureFile(path.join(staticPath, "assets", bundledAssetName), "export {};");
});

afterAll(() => {
  for (const file of createdFiles) {
    fs.rmSync(file, { force: true });
  }
  for (const dir of createdDirs.toReversed()) {
    fs.rmdirSync(dir);
  }
});

let server: Server;

beforeEach(async () => {
  server = await startServer({
    dbConnString: globalThis.__MONGO_URI__,
    dbName: faker.string.alphanumeric(10),
  });
});

afterEach(async () => {
  await closeServer(server);
});

describe("static file serving", () => {
  test("should serve bundled assets with an immutable cache header", async () => {
    const response = await request(server).get(`/assets/${bundledAssetName}`);

    expect(response.status).toEqual(200);
    expect(response.headers["cache-control"]).toEqual(
      "public, max-age=31536000, immutable",
    );
  });

  test("should serve static root files with no-cache even when the name looks hashed", async () => {
    const response = await request(server).get(`/${staticFileName}`);

    expect(response.status).toEqual(200);
    expect(response.headers["cache-control"]).toEqual("no-cache");
  });

  test("should serve index.html with no-cache so deploys are picked up", async () => {
    const response = await request(server).get("/index.html");

    expect(response.status).toEqual(200);
    expect(response.headers["cache-control"]).toEqual("no-cache");
  });

  test("should serve the root path with no-cache", async () => {
    const response = await request(server).get("/");

    expect(response.status).toEqual(200);
    expect(response.headers["cache-control"]).toEqual("no-cache");
  });

  test("should serve app routes from index.html with no-cache", async () => {
    const response = await request(server).get("/profile/group");

    expect(response.status).toEqual(200);
    expect(response.headers["cache-control"]).toEqual("no-cache");
    expect(response.headers["content-type"]).toContain("text/html");
  });

  test("should return 404 for a missing asset instead of index.html", async () => {
    const response = await request(server).get("/assets/missing-chunk.js");

    expect(response.status).toEqual(404);
  });

  test("should return 404 for unknown api paths", async () => {
    const response = await request(server).get("/api/does-not-exist");

    expect(response.status).toEqual(404);
  });
});
