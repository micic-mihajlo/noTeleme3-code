import Constants from "expo-constants";
import { Observe } from "expo-observe";

// Importing expo-observe installs its global JS error handler.
const appVariant: unknown = Constants.expoConfig?.extra?.appVariant;

// noTeleme3-code: crash reports never leave the device, so the setting is hidden.
export const crashReportingAvailable = false;

interface PromiseRejectionTracker {
  readonly enablePromiseRejectionTracker?: (options: {
    readonly allRejections: boolean;
    readonly onUnhandled: (id: number, rejection: unknown) => void;
  }) => void;
}

// React Native tracks unhandled rejections only in development, for LogBox; Observe has no hook.
if (!__DEV__) {
  const hermes: PromiseRejectionTracker | undefined = Reflect.get(globalThis, "HermesInternal");
  hermes?.enablePromiseRejectionTracker?.({
    allRejections: true,
    onUnhandled: (_id, rejection) => Observe.reportError(rejection),
  });
}

let latestConfiguration = 0;

// While sending is off, a dispatch pass drops what it finds, so one runs before turning it back on.
// Best effort: Observe skips the pass while it is backing off from a failed send.
export async function setCrashReportsEnabled(enabled: boolean) {
  const configuration = ++latestConfiguration;
  const dispatchingEnabled = crashReportingAvailable && enabled;
  if (dispatchingEnabled) {
    await Observe.dispatchEvents();
    if (configuration !== latestConfiguration) return;
  }
  Observe.configure({
    dispatchingEnabled,
    ...(typeof appVariant === "string" ? { environment: appVariant } : {}),
  });
}

void setCrashReportsEnabled(false);
