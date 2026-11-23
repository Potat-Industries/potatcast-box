import { useCallback, useSyncExternalStore } from "react";

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (listener: () => void) => {
      const mediaQueryList = window.matchMedia(query);
      mediaQueryList.addEventListener("change", listener);

      return () => mediaQueryList.removeEventListener("change", listener);
    },
    [query],
  );

  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches);
}
