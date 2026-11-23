import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { setStoredValue, useStoredValue } from "../../hooks/useStoredValue";

const CINEMA_MODE_STORAGE_KEY = "cinema-mode";

/** Cinema mode hides everything but the player and chat. `?cinemaMode=true` turns it on. */
export function useCinemaMode() {
  const [searchParams] = useSearchParams();
  const isRequestedByLink = searchParams.get("cinemaMode") === "true";

  const [storedValue] = useStoredValue(CINEMA_MODE_STORAGE_KEY, "false");
  // Honours the link from the very first render, before the effect below has saved it, so the
  // site header never flashes. Cleared once the viewer makes their own choice.
  const [isFollowingLink, setIsFollowingLink] = useState(isRequestedByLink);
  const isCinemaMode = isFollowingLink || storedValue === "true";

  useEffect(() => {
    if (isRequestedByLink) {
      setStoredValue(CINEMA_MODE_STORAGE_KEY, "true");
    }
  }, [isRequestedByLink]);

  const toggleCinemaMode = useCallback(() => {
    setIsFollowingLink(false);
    setStoredValue(CINEMA_MODE_STORAGE_KEY, String(!isCinemaMode));
  }, [isCinemaMode]);

  return { isCinemaMode, toggleCinemaMode };
}
