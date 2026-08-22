import { describe, expect, test } from "vitest";
import { z } from "zod";
import { config } from "shared/config";

// The event config is the one source of times that nothing validates on the way
// in: program item times are checked as they are ingested and again as they come
// out of the database, but these are hand-written and compiled straight into
// both bundles. They feed the sign-up window calculations and the formatters,
// which throw on a time they cannot parse, so a typo here surfaces far from its
// cause. Checked here rather than at startup because the config is static: what
// this test parses is exactly what ships
const isoTime = z.iso.datetime();

const EventConfigTimesSchema = z.object({
  eventStartTime: isoTime,
  preConventionWeekSignupStartTime: isoTime.nullable(),
  mainEventProgramVisibleTime: isoTime.nullable(),
  fixedLotterySignupTime: isoTime.nullable(),
  directSignupWindows: z
    .record(
      z.string(),
      z.array(
        z.object({
          signupWindowStart: isoTime,
          signupWindowClose: isoTime,
        }),
      ),
    )
    .nullable(),
  startTimesByParentIds: z.map(z.string(), isoTime),
});

describe("event config times", () => {
  test("are all parseable", () => {
    const result = EventConfigTimesSchema.safeParse(config.event());

    // Listed rather than asserted as a boolean, so a failure names the field
    expect(result.error?.issues ?? []).toEqual([]);
    expect(result.success).toEqual(true);
  });

  test("would be rejected if one were malformed", () => {
    const result = EventConfigTimesSchema.safeParse({
      ...config.event(),
      eventStartTime: "Fri 15:00",
    });

    expect(result.success).toEqual(false);
  });
});
