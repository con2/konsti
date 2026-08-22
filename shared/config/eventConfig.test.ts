import { describe, expect, test } from "vitest";
import { config } from "shared/config";
import { EventConfigSchema } from "shared/config/eventConfigTypes";

// The config is the one source of times that nothing validates on the way in:
// program item times are checked as they are ingested and again as they come out
// of the database, but these are hand-written and compiled straight into both
// bundles. They feed the sign-up window calculations and the formatters, which
// throw on a time they cannot parse, so a typo here surfaces far from its cause.
//
// Checked here rather than at startup because the config is static: what this
// test parses is exactly what ships. It parses the same schema the type is
// inferred from, so a new field is covered without being listed again
describe("event config", () => {
  test("matches its schema", () => {
    const result = EventConfigSchema.safeParse(config.event());

    // Listed rather than asserted as a boolean, so a failure names the field
    expect(result.error?.issues ?? []).toEqual([]);
    expect(result.success).toEqual(true);
  });

  test("would be rejected if a time were malformed", () => {
    const result = EventConfigSchema.safeParse({
      ...config.event(),
      eventStartTime: "Fri 15:00",
    });

    expect(result.success).toEqual(false);
  });
});
