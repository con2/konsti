// Mongod binary for the in-memory test server and the image the dev DB
// container runs. The compose and kubernetes files carry their own copy of
// the tag and must be bumped together with this one
export const mongoDbVersion = "9.0.4";
export const mongoDbImage = `mongo:${mongoDbVersion}-resolute`;
