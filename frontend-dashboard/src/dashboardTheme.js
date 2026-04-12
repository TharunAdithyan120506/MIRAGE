/**
 * Neobrutalist design tokens — off-white canvas, black strokes, red accent.
 * No radius, hard shadows only, high contrast.
 */
export const dash = {
  bg: '#F8F5EC',
  bgElevated: '#FCFAF2',
  card: '#FCFAF2',
  black: '#111111',
  red: '#9E1F27',
  redDark: '#5C1418',
  text: '#1E1E1E',
  textBody: '#2C2C2C',
  textMuted: '#2C2C2C',
  textSubtle: '#3D3D3D',
  /** Legacy keys mapped for gradual refactors */
  border: '#111111',
  borderMuted: '#111111',
  accent: '#9E1F27',
  accentStrong: '#5C1418',
  /** Sharp corners everywhere */
  radius: 0,
  radiusLg: 0,
  radiusMd: 0,
  borderWidth: 4,
  borderWidthSm: 3,
  /** Hard offset shadows only */
  shadowHard: '6px 6px 0 #111111',
  shadowHardLg: '8px 8px 0 rgba(0,0,0,0.22)',
  shadowHover: '-6px 6px 0 #111111',
  shadowHeader: 'none',
  shadowCard: '6px 6px 0 #111111',
  fontSans: "'Space Grotesk', system-ui, sans-serif",
  fontMono: "'JetBrains Mono', ui-monospace, monospace",
  maxContent: 1200,
  /** Rhythm — use for less crowded layouts */
  space: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32,
    section: 28,
  },
  lineBody: 1.55,
}

/** Shared typography for threat score (header + gauge). Import `dash` only where needed; mirror font stacks here to avoid circular refs. */
export const threatScoreLayout = {
  label: {
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  },
  suffix: {
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "'Space Grotesk', system-ui, sans-serif",
  },
  valueHero: {
    fontSize: 48,
    fontWeight: 800,
    fontFamily: "'Space Grotesk', system-ui, sans-serif",
    letterSpacing: '-0.04em',
    lineHeight: 1,
  },
  valueCompact: {
    fontSize: 26,
    fontWeight: 800,
    fontFamily: "'Space Grotesk', system-ui, sans-serif",
    letterSpacing: '-0.03em',
    lineHeight: 1.1,
  },
}

export function threatTierPillStyle(tierColor, { pulse = false } = {}) {
  return {
    display: 'inline-block',
    padding: `${dash.space.sm + 2}px ${dash.space.md}px`,
    borderRadius: dash.radius,
    background: dash.card,
    border: `${dash.borderWidthSm}px solid ${dash.black}`,
    color: tierColor,
    fontWeight: 800,
    fontSize: 11,
    textTransform: 'uppercase',
    fontFamily: dash.fontMono,
    boxShadow: pulse ? dash.shadowHard : 'none',
  }
}

export const TIER_HINTS = {
  'Script Kiddie': 'Basic probing — low concern',
  Opportunist: 'Trying common weak spots',
  'Targeted Attacker': 'Focused on sensitive areas',
  'APT-Level': 'Very aggressive — treat as serious',
}

export const EVENT_TYPE_LABELS = {
  PATH_PROBE: 'Suspicious path',
  LOGIN_ATTEMPT: 'Login attempt',
  HONEYTOKEN_ACCESS: 'Bait file opened',
  OTP_TRAP: 'OTP trap page',
  TELEMETRY: 'Telemetry',
  fingerprint_captured: 'Fingerprint captured',
}
