# Product analytics

noTeleme3-code collects no product analytics. [`AnalyticsService`](../../apps/server/src/telemetry/AnalyticsService.ts)
keeps its interface so call sites stay the same as upstream, which keeps merges small, but its
layer drops every event. Do not add an implementation that sends events anywhere.

Relay tracing is cut at one point: [`RelayTracing.layer`](../../packages/shared/src/relayTracing.ts)
always provides no tracer, whatever config the server, web, or mobile caller passes. Mobile crash
reporting is off in [`observe.ts`](../../apps/mobile/src/features/observability/observe.ts), and
its native endpoint in `apps/mobile/app.config.ts` never resolves.

When you merge upstream, check that these three points still hold, and search the diff for new
outbound endpoints such as `ingest.t3.codes`, `api.axiom.co`, or PostHog keys (`phc_`).
