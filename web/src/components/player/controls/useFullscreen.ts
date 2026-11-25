import { useCallback, useEffect, useState, type RefObject } from "react";

// Safari only exposes the prefixed fullscreen API on some versions, and iPhones can only put the
// video element itself into fullscreen, never an arbitrary container.
interface PrefixedDocument extends Document {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => void;
}

interface PrefixedElement extends HTMLElement {
  webkitRequestFullscreen?: () => void;
}

interface PrefixedVideoElement extends HTMLVideoElement {
  webkitEnterFullscreen?: () => void;
}

function getFullscreenElement(): Element | null {
  const prefixedDocument = document as PrefixedDocument;
  return document.fullscreenElement ?? prefixedDocument.webkitFullscreenElement ?? null;
}

function exitFullscreen(): void {
  const prefixedDocument = document as PrefixedDocument;
  if (document.exitFullscreen) {
    void document.exitFullscreen().catch(() => {});
  } else {
    prefixedDocument.webkitExitFullscreen?.();
  }
}

function enterFullscreen(container: PrefixedElement, video: PrefixedVideoElement | null): void {
  if (container.requestFullscreen) {
    void container.requestFullscreen().catch((error) => console.error("Fullscreen failed", error));
  } else if (container.webkitRequestFullscreen) {
    container.webkitRequestFullscreen();
  } else {
    video?.webkitEnterFullscreen?.();
  }
}

export function useFullscreen(
  containerRef: RefObject<HTMLElement | null>,
  videoRef: RefObject<HTMLVideoElement | null>,
) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const syncState = () => setIsFullscreen(getFullscreenElement() === containerRef.current);

    document.addEventListener("fullscreenchange", syncState);
    document.addEventListener("webkitfullscreenchange", syncState);

    return () => {
      document.removeEventListener("fullscreenchange", syncState);
      document.removeEventListener("webkitfullscreenchange", syncState);
    };
  }, [containerRef]);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    if (getFullscreenElement() === container) {
      exitFullscreen();
    } else {
      enterFullscreen(container, videoRef.current);
    }
  }, [containerRef, videoRef]);

  return { isFullscreen, toggleFullscreen };
}
