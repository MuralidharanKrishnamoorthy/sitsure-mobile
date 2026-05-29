export const COLORS = {
  primary: '#fe742a',
  primaryDark: '#e05a15',
  primaryLight: '#ff9a5c',
  primaryMuted: 'rgba(254,116,42,0.12)',
  primaryGlow: 'rgba(254,116,42,0.28)',
  secondary: '#ffb74d',

  // ── Backgrounds ──────────────────────────────────────────────────────────────
  bgLight: '#f2f2f7',          // iOS-system grey, warmer than pure white
  bgDark: '#0d0d0f',           // near-black, deep obsidian
  paperLight: '#ffffff',
  paperDark: '#16161a',        // elevated surface
  canvasDark: '#1c1c22',       // 2nd-level card / nested surface
  surfaceDark: '#222228',      // 3rd-level (modals, sheets)

  // ── Text ─────────────────────────────────────────────────────────────────────
  textPrimaryLight: '#18181b',
  textSecondaryLight: '#71717a',
  textTertiaryLight: '#a1a1aa',
  textPrimaryDark: '#f1f1f3',
  textSecondaryDark: '#8b8fa8',
  textTertiaryDark: '#52566a',

  // ── Seat status — standard ───────────────────────────────────────────────────
  seatAvailableBase: 'rgba(56,142,60,0.08)',
  seatAvailableAccent: '#4caf50',
  seatBookedBase: 'rgba(117,117,117,0.10)',
  seatBookedAccent: '#757575',
  seatDisabledBase: 'rgba(211,47,47,0.08)',
  seatDisabledAccent: '#ef5350',
  seatSelectedBase: 'rgba(25,118,210,0.12)',
  seatSelectedAccent: '#42a5f5',

  // ── Seat status — meeting room ───────────────────────────────────────────────
  meetingAvailableBase: 'rgba(255,152,0,0.08)',
  meetingAvailableAccent: '#ffa726',
  meetingBookedBase: 'rgba(255,152,0,0.12)',
  meetingBookedAccent: '#ff9800',
  meetingDisabledBase: 'rgba(189,189,189,0.10)',
  meetingDisabledAccent: '#bdbdbd',
  meetingSelectedBase: 'rgba(239,108,0,0.14)',
  meetingSelectedAccent: '#fb8c00',

  // ── Info panels ───────────────────────────────────────────────────────────────
  myBookingBg: 'rgba(25,118,210,0.08)',
  myBookingBorder: 'rgba(66,165,245,0.40)',
  myBookingText: '#42a5f5',
  restrictionBg: 'rgba(255,179,0,0.08)',
  restrictionBorder: 'rgba(255,214,0,0.40)',
  restrictionText: '#ffab00',

  // ── Monitor badge ─────────────────────────────────────────────────────────────
  monitorBadge: 'rgba(66,165,245,0.85)',
  monitorBadgeStroke: '#0d0d0f',

  // ── Status chips ─────────────────────────────────────────────────────────────
  statusBooked: '#4caf50',
  statusCompleted: '#42a5f5',
  statusCancelled: '#ef5350',
  statusWarning: '#ffa726',

  // ── Seat management cards ─────────────────────────────────────────────────────
  seatEnabledBg: '#43a047',
  seatDisabledBgCard: '#e53935',

  // ── Funsights chart ───────────────────────────────────────────────────────────
  chartColors: ['#fe742a', '#6c5ce7', '#00cec9', '#0984e3', '#fdcb6e'],

  // ── Group colors ──────────────────────────────────────────────────────────────
  groupColors: {
    SDOS: { bg: 'rgba(76,175,80,0.12)',  text: '#66bb6a' },
    SDL:  { bg: 'rgba(66,165,245,0.12)', text: '#42a5f5' },
    QA:   { bg: 'rgba(171,71,188,0.12)', text: '#ba68c8' },
    VENZO:{ bg: 'rgba(0,188,212,0.12)',  text: '#26c6da' },
    ALL:  { bg: 'rgba(254,116,42,0.12)', text: '#fe742a' },
  },
};
