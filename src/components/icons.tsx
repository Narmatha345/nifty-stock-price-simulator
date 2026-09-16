/** Small inline stroke icons used across the dashboard UI. Purely presentational. */

export type IconProps = { size?: number; className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function MarketIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...base}>
      <path d="M3 3v18h18" />
      <path d="M7 15l3.5-4.5L14 14l5-6" />
      <circle cx="19" cy="8" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SunIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...base}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.4M12 19.1v2.4M4.4 4.4l1.7 1.7M17.9 17.9l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.4 19.6l1.7-1.7M17.9 6.1l1.7-1.7" />
    </svg>
  );
}

export function MoonIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...base}>
      <path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11z" />
    </svg>
  );
}

export function RupeeIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...base}>
      <path d="M6 4h11M6 9h11M6 4c4.5 0 7 1.6 7 4.5S10.5 13 6 13l8 7" />
    </svg>
  );
}

export function TrendingUpIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...base}>
      <path d="M3 16l6-6 4 4 8-9" />
      <path d="M15 5h6v6" />
    </svg>
  );
}

export function TrendingDownIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...base}>
      <path d="M3 8l6 6 4-4 8 9" />
      <path d="M15 19h6v-6" />
    </svg>
  );
}

export function ActivityIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...base}>
      <path d="M2.5 12h4l2.5-7 4.5 14 2.5-7h5" />
    </svg>
  );
}

export function CalendarIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...base}>
      <rect x="3.5" y="4.5" width="17" height="16" rx="2.5" />
      <path d="M3.5 9.5h17M8 2.5v4M16 2.5v4" />
    </svg>
  );
}

export function HashIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...base}>
      <path d="M5 9h14M5 15h14M10 3.5L7.5 20.5M16.5 3.5L14 20.5" />
    </svg>
  );
}

export function PlayIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 4.5v15l13-7.5-13-7.5z" />
    </svg>
  );
}

export function FlagIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...base}>
      <path d="M5 3v18" />
      <path d="M5 4.5h13l-3 4 3 4H5" />
    </svg>
  );
}

export function TargetIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...base}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function PercentIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...base}>
      <path d="M5 19L19 5" />
      <circle cx="7" cy="7" r="2.3" />
      <circle cx="17" cy="17" r="2.3" />
    </svg>
  );
}

export function LineChartIcon({ size = 15, className }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...base}>
      <path d="M3 3v18h18" />
      <path d="M6 15l4-4 3 3 6-7" />
    </svg>
  );
}

export function AreaChartIcon({ size = 15, className }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...base}>
      <path d="M3 3v18h18" />
      <path d="M6 15l4-4 3 3 6-7v9H6z" fill="currentColor" fillOpacity="0.22" stroke="none" />
      <path d="M6 15l4-4 3 3 6-7" />
    </svg>
  );
}

export function TableIcon({ size = 15, className }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...base}>
      <rect x="3.5" y="4" width="17" height="16" rx="2" />
      <path d="M3.5 9.5h17M3.5 14.5h17M9.5 4v16" />
    </svg>
  );
}
