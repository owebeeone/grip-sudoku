const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** Hand-drawn-ish 3x3 grid with an inked "9" — the app mark. */
export function LogoMark(props: { className?: string }) {
  return (
    <svg className={props.className ?? 'logo-mark'} viewBox="0 0 32 32" aria-hidden="true">
      <rect x="3" y="3" width="26" height="26" rx="5" fill="var(--bg-panel)" stroke="var(--border-strong)" strokeWidth="2" />
      <g stroke="var(--border-strong)" strokeWidth="1.2" opacity="0.6">
        <line x1="11.5" y1="4" x2="11.5" y2="28" />
        <line x1="20.5" y1="4" x2="20.5" y2="28" />
        <line x1="4" y1="11.5" x2="28" y2="11.5" />
        <line x1="4" y1="20.5" x2="28" y2="20.5" />
      </g>
      <text
        x="16"
        y="24.5"
        textAnchor="middle"
        fontFamily="var(--font-hand)"
        fontSize="20"
        fontWeight="700"
        fill="var(--entered-text)"
        transform="rotate(-6 16 16)"
      >
        9
      </text>
    </svg>
  );
}

export function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d="M4 20l4-1 10-10-3-3L5 16z" />
      <path d="M13 7l3 3" />
    </svg>
  );
}

export function PenIcon() {
  return (
    <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d="M12 19l7-7 3 3-7 7-3-3z" />
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18z" />
    </svg>
  );
}

export function UndoIcon() {
  return (
    <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d="M9 14L4 9l5-5" />
      <path d="M4 9h11a5 5 0 0 1 0 10h-2" />
    </svg>
  );
}

export function RedoIcon() {
  return (
    <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d="M15 14l5-5-5-5" />
      <path d="M20 9H9a5 5 0 0 0 0 10h2" />
    </svg>
  );
}

export function EraserIcon() {
  return (
    <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d="M7 21h10" />
      <path d="M5.5 15.5l9-9a2 2 0 0 1 3 0l2 2a2 2 0 0 1 0 3l-9 9H8l-2.5-2.5a2 2 0 0 1 0-2.5z" />
      <path d="M11 20l6-6" />
    </svg>
  );
}

export function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

export function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true" style={{ width: 14, height: 14 }}>
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}
