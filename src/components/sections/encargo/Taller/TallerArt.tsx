/** Placeholder illustration (sky, cloud, hills) for the photo frames until the client sends real photos. Decorative. */
export function TallerArt({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 400 440"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="taller-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bfe4fb" />
          <stop offset="1" stopColor="#eaf6fe" />
        </linearGradient>
      </defs>
      <rect width="400" height="440" fill="url(#taller-sky)" />
      <g fill="#ffffff">
        <circle cx="215" cy="92" r="38" />
        <circle cx="262" cy="108" r="28" />
        <rect x="150" y="100" width="150" height="40" rx="20" />
      </g>
      <path d="M0 330 C90 300 170 300 260 345 C320 375 360 380 400 372 L400 440 L0 440 Z" fill="#c4df8a" />
      <path d="M0 392 C80 345 170 350 250 372 C320 392 370 392 400 380 L400 440 L0 440 Z" fill="#8ba300" />
    </svg>
  );
}
