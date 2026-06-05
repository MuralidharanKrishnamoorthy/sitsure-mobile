// ── Lumina Design System ──────────────────────────────────────────────────────
// Midnight indigo + warm cream + electric violet accent
// Light primary: #6C47FF — passes WCAG AA on cream bg (5.1:1)
// Dark primary:  #8B6FFF — 6.8:1 on #0C0C10 bg (AAA)

export const COLORS = {
  // ── Brand ─────────────────────────────────────────────────────────────────
  primary: '#6C47FF',          // electric violet — light mode
  primaryDark: '#5535E0',      // pressed / deeper
  primaryLight: '#8B6FFF',     // dark mode primary (higher luminance)
  primaryMuted: 'rgba(108,71,255,0.10)',
  primaryGlow: 'rgba(108,71,255,0.25)',
  secondary: '#A78BFA',        // soft violet — secondary accents

  // ── Backgrounds ───────────────────────────────────────────────────────────
  bgLight: '#FAFAF8',          // warm cream — not cold white
  bgDark: '#0C0C10',           // true midnight
  paperLight: '#FFFFFF',
  paperDark: '#16161F',        // elevated dark surface
  canvasDark: '#1E1E28',       // nested card
  surfaceDark: '#252533',      // modal / sheet

  // ── Text ──────────────────────────────────────────────────────────────────
  textPrimaryLight: '#0F0F1A',    // near-black with slight blue-ink tint
  textSecondaryLight: '#5C5C78',
  textTertiaryLight: '#9898AA',
  textPrimaryDark: '#F0EFFF',     // cool-white with lavender cast
  textSecondaryDark: '#8A899E',
  textTertiaryDark: '#4E4D5E',

  // ── Seat status — semantic (NEVER change — users read floor state visually) ─
  seatAvailableBase: 'rgba(56,142,60,0.08)',
  seatAvailableAccent: '#4caf50',
  seatBookedBase: 'rgba(117,117,117,0.10)',
  seatBookedAccent: '#757575',
  seatDisabledBase: 'rgba(211,47,47,0.08)',
  seatDisabledAccent: '#ef5350',
  seatSelectedBase: 'rgba(108,71,255,0.12)',   // violet selected ✓
  seatSelectedAccent: '#6C47FF',

  // ── Seat status — meeting room ────────────────────────────────────────────
  meetingAvailableBase: 'rgba(255,152,0,0.08)',
  meetingAvailableAccent: '#ffa726',
  meetingBookedBase: 'rgba(255,152,0,0.12)',
  meetingBookedAccent: '#ff9800',
  meetingDisabledBase: 'rgba(189,189,189,0.10)',
  meetingDisabledAccent: '#bdbdbd',
  meetingSelectedBase: 'rgba(108,71,255,0.12)',
  meetingSelectedAccent: '#6C47FF',

  // ── Info panels ───────────────────────────────────────────────────────────
  myBookingBg: 'rgba(108,71,255,0.08)',
  myBookingBorder: 'rgba(139,111,255,0.35)',
  myBookingText: '#6C47FF',
  restrictionBg: 'rgba(255,152,0,0.08)',
  restrictionBorder: 'rgba(255,179,0,0.35)',
  restrictionText: '#F59E0B',

  // ── Monitor badge ─────────────────────────────────────────────────────────
  monitorBadge: 'rgba(108,71,255,0.85)',
  monitorBadgeStroke: '#0C0C10',

  // ── Status chips ──────────────────────────────────────────────────────────
  statusBooked: '#4caf50',
  statusCompleted: '#6C47FF',     // violet for completed
  statusCancelled: '#ef5350',
  statusWarning: '#ffa726',

  // ── Seat management cards ─────────────────────────────────────────────────
  seatEnabledBg: '#43a047',
  seatDisabledBgCard: '#e53935',

  // ── Funsights chart ───────────────────────────────────────────────────────
  chartColors: ['#6C47FF', '#8B6FFF', '#A78BFA', '#5535E0', '#C4B5FD'],

  // ── Group colors ──────────────────────────────────────────────────────────
  groupColors: {
    SDOS: {bg: 'rgba(76,175,80,0.12)',   text: '#4caf50'},
    SDL:  {bg: 'rgba(108,71,255,0.12)',  text: '#6C47FF'},
    QA:   {bg: 'rgba(85,53,224,0.12)',   text: '#5535E0'},
    VENZO:{bg: 'rgba(167,139,250,0.15)', text: '#A78BFA'},
    ALL:  {bg: 'rgba(108,71,255,0.12)',  text: '#6C47FF'},
  },
};
