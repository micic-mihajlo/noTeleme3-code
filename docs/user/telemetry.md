# Telemetry in noTeleme3-code

This fork removes the data T3 Code sends to its maintainers. A server, desktop app, web app, or
mobile app built from this repository sends none of the following.

- **Product usage events.** Upstream sends these to `ingest.t3.codes`, which forwards them to
  PostHog. Here the analytics service records nothing and has no endpoint or key. It no longer
  creates an install ID or reads your OpenAI, Claude, or T3 Connect account IDs for analytics.
- **Relay connection traces.** Upstream sends these to Axiom. Here the relay tracer is never
  created, even when a `*_OTLP_TRACES_*` variable or build setting supplies an endpoint.
- **Mobile crash reports and startup timings.** The mobile app never turns on sending, its native
  endpoint points at an address that never resolves, and the **Send crash reports** setting is hidden.
- **Agent feedback.** The **Agent feedback** mode in **Settings > Labs** still controls whether
  agents can draft reports, and approved reports are still saved on your machine. None are sent,
  and `t3 feedback list` shows each one as unsent.

`T3CODE_TELEMETRY_ENABLED` and the managed-policy `telemetry` limit no longer matter, because
there is nothing left for them to switch off.

## What still uses the network

These are features, not telemetry. Each one sends data only when you use it.

- **Your own OpenTelemetry receiver.** Traces, metrics, and logs go to an OTLP endpoint only
  when you set one in **Settings > Maintenance > Diagnostics** or with `T3CODE_OTLP_*_URL` or
  `OTEL_EXPORTER_OTLP_*`.
- **T3 Connect.** Signing in and using the relay talks to T3's relay and auth services.
- **Publish agent activity.** When this is on, a host sends project and thread titles, model
  names, and activity status to the T3 Connect relay for
  [mobile notifications](./mobile-notifications.md). Turn it off under
  **Settings > Sharing & access**.
- **Updates.** The `t3` CLI and server updates install upstream T3 Code releases from npm and
  GitHub, and only when you start one. An upstream update replaces this fork with a build that
  has telemetry on. Mobile over-the-air updates come from upstream's Expo project, so they are off
  unless you build with `T3CODE_MOBILE_UPDATES_ENABLED=1`.

## Clients you did not build

Only clients built from this repository are clean. If you connect to a noTeleme3-code server from
`app.t3.codes` or the official mobile apps, those clients still send their own relay traces and
crash reports to T3.
