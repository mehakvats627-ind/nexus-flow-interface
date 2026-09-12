import { useCallback, useSyncExternalStore } from "react";
import { getVersion, subscribe } from "./mock-service";

/** Re-renders the caller whenever the mock service layer changes. */
export function useNexus<T>(select: () => T): T {
  const getSnapshot = useCallback(() => select(), [select]);
  useSyncExternalStore(subscribe, getVersion, getVersion);
  return getSnapshot();
}

/** Simple tick so relative timestamps stay in sync with store updates. */
export function useNexusVersion() {
  return useSyncExternalStore(subscribe, getVersion, getVersion);
}
