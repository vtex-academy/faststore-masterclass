import { useEffect, useState } from "react";

export type Viewport = "desktop" | "mobile";

export const useViewport = () => {
  const [viewport, setViewport] = useState<Viewport>();

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const updateViewport = () =>
      setViewport(media.matches ? "mobile" : "desktop");

    updateViewport();
    media.addEventListener("change", updateViewport);

    return () => media.removeEventListener("change", updateViewport);
  }, []);

  return viewport;
};
