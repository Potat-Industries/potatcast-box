import { useCallback, type RefObject } from "react";

const isPictureInPictureSupported =
  typeof document !== "undefined" &&
  document.pictureInPictureEnabled === true &&
  typeof HTMLVideoElement !== "undefined" &&
  "requestPictureInPicture" in HTMLVideoElement.prototype;

export function usePictureInPicture(videoRef: RefObject<HTMLVideoElement | null>) {
  const togglePictureInPicture = useCallback(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const request =
      document.pictureInPictureElement === video
        ? document.exitPictureInPicture()
        : video.requestPictureInPicture();

    void request.catch((error) => console.error("Picture-in-picture failed", error));
  }, [videoRef]);

  return { isPictureInPictureSupported, togglePictureInPicture };
}
