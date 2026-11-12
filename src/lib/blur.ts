// Shared tiny placeholder shown by next/image while a remote photo loads (keeps the slot from flashing blank).
// Per-image blur data is intentionally not generated; this is one neutral, paper-tinted constant.
const SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 5'><filter id='b' color-interpolation-filters='sRGB'>" +
  "<feGaussianBlur stdDeviation='1'/></filter><rect width='8' height='5' fill='#d8d2c6' filter='url(#b)'/></svg>";

export const BLUR_DATA_URL = `data:image/svg+xml;base64,${btoa(SVG)}`;
