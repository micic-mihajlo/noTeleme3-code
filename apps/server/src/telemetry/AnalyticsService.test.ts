import { assert, it } from "@effect/vitest";
import * as Effect from "effect/Effect";

import * as AnalyticsService from "./AnalyticsService.ts";

it.effect("records nothing and sends nothing", () =>
  Effect.gen(function* () {
    const analytics = yield* AnalyticsService.AnalyticsService;
    const queued = yield* analytics.record("thread.created", { provider: "codex" });
    yield* analytics.recordOwners([{ source: "openai", ownerId: "hash" }], "server");
    yield* analytics.flush;
    assert.isFalse(queued);
  }).pipe(Effect.provide(AnalyticsService.layer)),
);
