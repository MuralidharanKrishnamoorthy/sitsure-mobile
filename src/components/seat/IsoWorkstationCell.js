import React from 'react';
import {TouchableOpacity, View, Text} from 'react-native';
import Svg, {
  Path,
  G,
  Ellipse,
  Line,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  RadialGradient,
} from 'react-native-svg';
import {COLORS} from '../../theme/colors';

const C30 = 0.866025; // cos(30°)
const S30 = 0.5; // sin(30°)

function iso(x, y, z, ox, oy, u) {
  return {
    x: ox + (x - z) * C30 * u,
    y: oy + (x + z) * S30 * u - y * u,
  };
}

// 4-point closed path
function quad(a, b, c, d) {
  return `M${a.x},${a.y} L${b.x},${b.y} L${c.x},${c.y} L${d.x},${d.y}Z`;
}

// rounded quad path helper using bezier curves for smooth 2.5D contours
function roundedQuadPath(A, B, C, D, r = 0.15) {
  const ab1 = {x: A.x + (B.x - A.x) * r, y: A.y + (B.y - A.y) * r};
  const ab2 = {x: B.x + (A.x - B.x) * r, y: B.y + (A.y - B.y) * r};
  const bc1 = {x: B.x + (C.x - B.x) * r, y: B.y + (C.y - B.y) * r};
  const bc2 = {x: C.x + (B.x - C.x) * r, y: C.y + (B.y - C.y) * r};
  const cd1 = {x: C.x + (D.x - C.x) * r, y: C.y + (D.y - C.y) * r};
  const cd2 = {x: D.x + (C.x - D.x) * r, y: D.y + (C.y - D.y) * r};
  const da1 = {x: D.x + (A.x - D.x) * r, y: D.y + (A.y - D.y) * r};
  const da2 = {x: A.x + (D.x - A.x) * r, y: A.y + (D.y - A.y) * r};

  return `M${ab1.x},${ab1.y} L${ab2.x},${ab2.y} Q${B.x},${B.y} ${bc1.x},${bc1.y} L${bc2.x},${bc2.y} Q${C.x},${C.y} ${cd1.x},${cd1.y} L${cd2.x},${cd2.y} Q${D.x},${D.y} ${da1.x},${da1.y} L${da2.x},${da2.y} Q${A.x},${A.y} ${ab1.x},${ab1.y}Z`;
}

// Parse color → [r,g,b]
function toRgb(col) {
  if (!col) {
    return [80, 60, 200];
  }
  if (col.startsWith('rgba') || col.startsWith('rgb')) {
    const m = col.match(/[\d.]+/g);
    return m
      ? [parseFloat(m[0]), parseFloat(m[1]), parseFloat(m[2])]
      : [80, 60, 200];
  }
  const h = col.replace('#', '');
  const f =
    h.length === 3
      ? h
          .split('')
          .map(c => c + c)
          .join('')
      : h;
  return [
    parseInt(f.slice(0, 2), 16),
    parseInt(f.slice(2, 4), 16),
    parseInt(f.slice(4, 6), 16),
  ];
}

function rgba(r, g, b, a = 1) {
  return `rgba(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)},${a})`;
}
function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

// Build a rich 6-shade palette from booking-state border color
function palette(borderColor) {
  const [r, g, b] = toRgb(borderColor);
  return {
    top: rgba(
      clamp(r + 72, 0, 255),
      clamp(g + 72, 0, 255),
      clamp(b + 72, 0, 255),
      0.92,
    ),
    mid: rgba(
      clamp(r + 30, 0, 255),
      clamp(g + 30, 0, 255),
      clamp(b + 30, 0, 255),
      0.85,
    ),
    side: rgba(
      clamp(r - 15, 0, 255),
      clamp(g - 15, 0, 255),
      clamp(b - 15, 0, 255),
      0.82,
    ),
    dark: rgba(
      clamp(r - 45, 0, 255),
      clamp(g - 45, 0, 255),
      clamp(b - 45, 0, 255),
      0.9,
    ),
    vdark: rgba(
      clamp(r - 70, 0, 255),
      clamp(g - 70, 0, 255),
      clamp(b - 70, 0, 255),
      0.95,
    ),
    edge: rgba(r, g, b, 1),
    wood: rgba(
      clamp(r + 55, 0, 255),
      clamp(g + 45, 0, 255),
      clamp(b + 10, 0, 255),
      0.88,
    ),
    woodSide: rgba(
      clamp(r + 20, 0, 255),
      clamp(g + 16, 0, 255),
      clamp(b - 10, 0, 255),
      0.82,
    ),
    fabric: rgba(
      clamp(r * 0.3 + 50, 0, 255),
      clamp(g * 0.3 + 50, 0, 255),
      clamp(b * 0.3 + 65, 0, 255),
      0.95,
    ),
    fabricDark: rgba(
      clamp(r * 0.2 + 30, 0, 255),
      clamp(g * 0.2 + 30, 0, 255),
      clamp(b * 0.2 + 45, 0, 255),
      0.95,
    ),
    fabricLight: rgba(
      clamp(r * 0.38 + 85, 0, 255),
      clamp(g * 0.38 + 80, 0, 255),
      clamp(b * 0.38 + 95, 0, 255),
      0.9,
    ),
    metal: 'rgba(110,112,122,0.90)',
    metalDark: 'rgba(55,56,62,0.95)',
    metalLight: 'rgba(165,168,178,0.88)',
    glow: rgba(r, g, b, 0.22),
    shadow: 'rgba(0,0,0,0.24)',
    highlight: rgba(
      clamp(r + 100, 0, 255),
      clamp(g + 100, 0, 255),
      clamp(b + 100, 0, 255),
      0.35,
    ),
  };
}

export function IsoWorkstationCell({
  seat,
  colors,
  seatW,
  seatH,
  onPress,
  disabled,
  style,
}) {
  if (!seat) {
    return <View style={[{width: seatW, height: seatH}, style]} />;
  }

  const hasMonitor = !!seat.has_monitor;
  const label = seat.floor?.name
    ? `${seat.floor.name}-${seat.label}`
    : seat.label;

  const labelH = Math.max(11, seatH * 0.17);
  const pad = 4;
  const svgW = seatW - pad * 2;
  const svgH = seatH - labelH - pad * 2;

  const pal = palette(colors.border);

  // ── Determine seat booking/selection states based on color logic ───────────
  const isSelected =
    colors.border === COLORS.seatSelectedAccent ||
    colors.border === COLORS.meetingSelectedAccent;
  const isMyBooked =
    colors.border === COLORS.myBookingBorder ||
    colors.text === COLORS.myBookingText;
  const isBooked =
    !isMyBooked &&
    (colors.border === COLORS.seatBookedAccent ||
      colors.border === COLORS.meetingBookedAccent);
  const isDisabled = !seat.enabled;

  const isMonitorActive = isSelected || isMyBooked;
  const glowColor = isMyBooked ? COLORS.primary : colors.border;

  // ── Scene fit ──────────────────────────────────────────────────────────────
  const u = Math.min(svgW / 6.0, svgH / 4.4) * 0.9;
  const ox = svgW * 0.54;
  const oy = svgH * 0.82;
  const p = (x, y, z) => iso(x, y, z, ox, oy, u);

  // ── Desk world dimensions ──────────────────────────────────────────────────
  const DW = 3.0,
    DH = 0.16,
    DD = 1.5,
    DLH = 1.1; // width, thickness, depth, leg height
  const LW = 0.11,
    LD = 0.11; // leg cross-section

  // Desk surface corners
  const dTFL = p(0, DH + DLH, 0),
    dTFR = p(DW, DH + DLH, 0);
  const dTBR = p(DW, DH + DLH, DD),
    dTBL = p(0, DH + DLH, DD);
  // Front apron face
  const dFTL = p(0, DH + DLH, 0),
    dFTR = p(DW, DH + DLH, 0);
  const dFBR = p(DW, DLH, 0),
    dFBL = p(0, DLH, 0);
  // Right apron face
  const dRTL = p(DW, DH + DLH, 0),
    dRTR = p(DW, DH + DLH, DD);
  const dRBR = p(DW, DLH, DD),
    dRBL = p(DW, DLH, 0);

  // 4 legs — front-left, front-right, back-left, back-right (only FL+FR visible)
  function leg(lx, lz) {
    return {
      front: [
        p(lx, DLH, lz),
        p(lx + LW, DLH, lz),
        p(lx + LW, 0, lz),
        p(lx, 0, lz),
      ],
      right: [
        p(lx + LW, DLH, lz),
        p(lx + LW, DLH, lz + LD),
        p(lx + LW, 0, lz + LD),
        p(lx + LW, 0, lz),
      ],
      top: [
        p(lx, DLH, lz),
        p(lx + LW, DLH, lz),
        p(lx + LW, DLH, lz + LD),
        p(lx, DLH, lz + LD),
      ],
    };
  }
  const legFL = leg(0.18, 0.14);
  const legFR = leg(DW - LW - 0.18, 0.14);
  // Cross-bar brace (low horizontal, front face)
  const cbY = DLH * 0.38;
  const cbTFL = p(0.22, cbY + 0.06, 0.14),
    cbTFR = p(DW - 0.22, cbY + 0.06, 0.14);
  const cbBFL = p(0.22, cbY, 0.14),
    cbBFR = p(DW - 0.22, cbY, 0.14);

  // Desk surface wood-grain lines (3 subtle lines across top)
  const grain = [0.28, 0.5, 0.72].map(t => ({
    a: p(DW * t, DH + DLH + 0.005, 0),
    b: p(DW * t, DH + DLH + 0.005, DD),
  }));

  // Cable grommet hole on desk surface (near back-right)
  const grX = DW * 0.72,
    grZ = DD * 0.62;
  const grommOuter = p(grX, DH + DLH + 0.01, grZ);

  // ── Monitor setup ──────────────────────────────────────────────────────────
  const mX = DW * 0.3,
    mZ = DD * 0.28,
    mW = 1.3,
    mH = 0.95,
    mD = 0.07;
  const deskY = DH + DLH;

  // Stand base (wide trapezoid)
  const sbW = 0.52,
    sbD = 0.28,
    sbH = 0.04;
  const sbX = mX + mW / 2 - sbW / 2,
    sbZ = mZ + mD / 2 - sbD / 2;
  const sbTFL = p(sbX, deskY + sbH, sbZ),
    sbTFR = p(sbX + sbW, deskY + sbH, sbZ);
  const sbTBR = p(sbX + sbW, deskY + sbH, sbZ + sbD),
    sbTBL = p(sbX, deskY + sbH, sbZ + sbD);
  const sbFFL = p(sbX, deskY, sbZ),
    sbFFR = p(sbX + sbW, deskY, sbZ);

  // Stand neck
  const snW = 0.13,
    snD = 0.1,
    snH = 0.28;
  const snX = mX + mW / 2 - snW / 2,
    snZ = mZ + mD / 2 - snD / 2;
  const snTFL = p(snX, deskY + sbH + snH, snZ),
    snTFR = p(snX + snW, deskY + sbH + snH, snZ);
  const snTBR = p(snX + snW, deskY + sbH + snH, snZ + snD),
    snTBL = p(snX, deskY + sbH + snH, snZ + snD);
  const snFFL = p(snX, deskY + sbH, snZ),
    snFFR = p(snX + snW, deskY + sbH, snZ);
  const snRTL = p(snX + snW, deskY + sbH + snH, snZ),
    snRTR = p(snX + snW, deskY + sbH + snH, snZ + snD);
  const snRBR = p(snX + snW, deskY + sbH, snZ + snD),
    snRBL = p(snX + snW, deskY + sbH, snZ);

  // Monitor bezel — 3 faces
  const monBotY = deskY + sbH + snH,
    monTopY = monBotY + mH;
  // Front face (main screen face)
  const mFTL = p(mX, monTopY, mZ),
    mFTR = p(mX + mW, monTopY, mZ);
  const mFBR = p(mX + mW, monBotY, mZ),
    mFBL = p(mX, monBotY, mZ);
  // Right face
  const mRTL = p(mX + mW, monTopY, mZ),
    mRTR = p(mX + mW, monTopY, mZ + mD);
  const mRBR = p(mX + mW, monBotY, mZ + mD),
    mRBL = p(mX + mW, monBotY, mZ);
  // Top face
  const mTFL = p(mX, monTopY, mZ),
    mTFR = p(mX + mW, monTopY, mZ);
  const mTBR = p(mX + mW, monTopY, mZ + mD),
    mTBL = p(mX, monTopY, mZ + mD);

  // Screen inset (bezel margin ~6%)
  const bm = 0.06;
  const scTL = {
    x: mFTL.x + (mFTR.x - mFTL.x) * bm + (mFBL.x - mFTL.x) * bm,
    y: mFTL.y + (mFTR.y - mFTL.y) * bm + (mFBL.y - mFTL.y) * bm,
  };
  const scTR = {
    x: mFTR.x - (mFTR.x - mFTL.x) * bm + (mFBR.x - mFTR.x) * bm,
    y: mFTR.y - (mFTR.y - mFTL.y) * bm + (mFBR.y - mFTR.y) * bm,
  };
  const scBR = {
    x: mFBR.x - (mFBR.x - mFBL.x) * bm - (mFTR.x - mFBR.x) * bm,
    y: mFBR.y - (mFBR.y - mFBL.y) * bm - (mFTR.y - mFBR.y) * bm,
  };
  const scBL = {
    x: mFBL.x + (mFBR.x - mFBL.x) * bm - (mFTL.x - mFBL.x) * bm,
    y: mFBL.y + (mFBR.y - mFBL.y) * bm - (mFTL.y - mFBL.y) * bm,
  };

  // UI mockup lines on screen (3 horizontal bars = app window illusion)
  const uiLines = [0.25, 0.48, 0.68].map(t => ({
    a: {
      x: scTL.x + (scBL.x - scTL.x) * t + (scTR.x - scTL.x) * 0.08,
      y: scTL.y + (scBL.y - scTL.y) * t + (scTR.y - scTL.y) * 0.08,
    },
    b: {
      x: scTR.x + (scBR.x - scTR.x) * t - (scTR.x - scTL.x) * 0.08,
      y: scTR.y + (scBR.y - scTR.y) * t - (scTR.y - scTL.y) * 0.08,
    },
  }));

  // Glare diagonal on screen
  const glare1a = {
    x: scTL.x + (scTR.x - scTL.x) * 0.08 + (scBL.x - scTL.x) * 0.1,
    y: scTL.y + (scTR.y - scTL.y) * 0.08 + (scBL.y - scTL.y) * 0.1,
  };
  const glare1b = {
    x: scTL.x + (scTR.x - scTL.x) * 0.48 + (scBL.x - scTL.x) * 0.06,
    y: scTL.y + (scTR.y - scTL.y) * 0.48 + (scBL.y - scTL.y) * 0.06,
  };

  // ── Keyboard ──────────────────────────────────────────────────────────────
  const kbX = mX - 0.22,
    kbZ = mZ + mD + 0.18,
    kbW = 0.95,
    kbD = 0.4,
    kbH = 0.038;
  const kbTFL = p(kbX, deskY + kbH, kbZ),
    kbTFR = p(kbX + kbW, deskY + kbH, kbZ);
  const kbTBR = p(kbX + kbW, deskY + kbH, kbZ + kbD),
    kbTBL = p(kbX, deskY + kbH, kbZ + kbD);
  const kbFFL = p(kbX, deskY, kbZ),
    kbFFR = p(kbX + kbW, deskY, kbZ);
  const kbRTL = p(kbX + kbW, deskY + kbH, kbZ),
    kbRTR = p(kbX + kbW, deskY + kbH, kbZ + kbD);
  const kbRBR = p(kbX + kbW, deskY, kbZ + kbD),
    kbRBL = p(kbX + kbW, deskY, kbZ);
  // Key rows (4 lines)
  const keyRows = [0.22, 0.42, 0.62, 0.8].map(t => ({
    a: {
      x: kbTFL.x + (kbTFR.x - kbTFL.x) * 0.06 + (kbTBL.x - kbTFL.x) * t,
      y: kbTFL.y + (kbTFR.y - kbTFL.y) * 0.06 + (kbTBL.y - kbTFL.y) * t,
    },
    b: {
      x: kbTFR.x - (kbTFR.x - kbTFL.x) * 0.06 + (kbTBR.x - kbTFR.x) * t,
      y: kbTFR.y - (kbTFR.y - kbTFL.y) * 0.06 + (kbTBR.y - kbTFR.y) * t,
    },
  }));
  // Trackpad
  const tpX = kbX + kbW * 0.3,
    tpZ = kbZ + kbD * 0.18,
    tpW = kbW * 0.4,
    tpD = kbD * 0.52;
  const tpTFL = p(tpX, deskY + kbH + 0.008, tpZ),
    tpTFR = p(tpX + tpW, deskY + kbH + 0.008, tpZ);
  const tpTBR = p(tpX + tpW, deskY + kbH + 0.008, tpZ + tpD),
    tpTBL = p(tpX, deskY + kbH + 0.008, tpZ + tpD);

  // ── Mouse ─────────────────────────────────────────────────────────────────
  const msX = kbX + kbW + 0.18,
    msZ = kbZ + kbD * 0.15,
    msW = 0.25,
    msD = 0.35,
    msH = 0.05;
  const msTFL = p(msX, deskY + msH, msZ),
    msTFR = p(msX + msW, deskY + msH, msZ);
  const msTBR = p(msX + msW, deskY + msH, msZ + msD),
    msTBL = p(msX, deskY + msH, msZ + msD);
  const msFFL = p(msX, deskY, msZ),
    msFFR = p(msX + msW, deskY, msZ);
  const msRTL = p(msX + msW, deskY + msH, msZ),
    msRTR = p(msX + msW, deskY + msH, msZ + msD);
  const msRBR = p(msX + msW, deskY, msZ + msD),
    msRBL = p(msX + msW, deskY, msZ);

  // ── Papers (no-monitor version) ───────────────────────────────────────────
  const pp1X = DW * 0.28,
    pp1Z = DD * 0.28,
    pp1W = 0.8,
    pp1D = 0.55;
  const pp2X = pp1X + 0.07,
    pp2Z = pp1Z + 0.04,
    pp2W = pp1W * 0.85,
    pp2D = pp1D * 0.9;
  // Sheet 1 (bottom)
  const s1FL = p(pp1X, deskY + 0.02, pp1Z),
    s1FR = p(pp1X + pp1W, deskY + 0.02, pp1Z);
  const s1BR = p(pp1X + pp1W, deskY + 0.02, pp1Z + pp1D),
    s1BL = p(pp1X, deskY + 0.02, pp1Z + pp1D);
  // Sheet 2 (top, offset)
  const s2FL = p(pp2X, deskY + 0.038, pp2Z),
    s2FR = p(pp2X + pp2W, deskY + 0.038, pp2Z);
  const s2BR = p(pp2X + pp2W, deskY + 0.038, pp2Z + pp2D),
    s2BL = p(pp2X, deskY + 0.038, pp2Z + pp2D);
  // Pen on paper
  const penAX = pp2X + pp2W * 0.12,
    penAZ = pp2Z + pp2D * 0.3;
  const penBX = pp2X + pp2W * 0.82,
    penBZ = pp2Z + pp2D * 0.22;
  const penA = p(penAX, deskY + 0.055, penAZ);
  const penB = p(penBX, deskY + 0.055, penBZ);

  // ── CHAIR Proportions (Upgrade to D-Level Premium Ergonomic) ───────────────
  const cX = -1.65,
    cZ = DD * 0.12;
  const cSW = 1.15,
    cSD = 1.15,
    cSH = 0.13; // seat pan dimensions
  const cLH = 0.88; // seat base height
  const cBH = 1.35,
    cBW = 0.95,
    cBD = 0.16; // backrest dimensions
  const cAH = 0.28,
    cAW = 0.48,
    cAD = 0.08; // armrest dimensions
  const cHW = 0.65,
    cHH = 0.22; // headrest dimensions

  // Seat pan top vertices
  const spTFL = p(cX, cLH + cSH, cZ),
    spTFR = p(cX + cSW, cLH + cSH, cZ);
  const spTBR = p(cX + cSW, cLH + cSH, cZ + cSD),
    spTBL = p(cX, cLH + cSH, cZ + cSD);
  // Seat pan bottom vertices
  const spBFL = p(cX, cLH, cZ),
    spBFR = p(cX + cSW, cLH, cZ);
  const spBBR = p(cX + cSW, cLH, cZ + cSD),
    spBBL = p(cX, cLH, cZ + cSD);

  // Sewing seam top contour points (inset for realism)
  const seamInset = 0.08;
  const seamTFL = p(
    cX + cSW * seamInset,
    cLH + cSH + 0.006,
    cZ + cSD * seamInset,
  );
  const seamTFR = p(
    cX + cSW * (1 - seamInset),
    cLH + cSH + 0.006,
    cZ + cSD * seamInset,
  );
  const seamTBR = p(
    cX + cSW * (1 - seamInset),
    cLH + cSH + 0.006,
    cZ + cSD * (1 - seamInset),
  );
  const seamTBL = p(
    cX + cSW * seamInset,
    cLH + cSH + 0.006,
    cZ + cSD * (1 - seamInset),
  );

  // Backrest structural corners
  const bkBotY = cLH + cSH,
    bkTopY = cLH + cSH + cBH;
  const bkX = cX + (cSW - cBW) * 0.5,
    bkZ = cZ + cSD - cBD;

  const bkBL = p(bkX, bkBotY, bkZ);
  const bkBR = p(bkX + cBW, bkBotY, bkZ);
  const bkTL = p(bkX + cBW * 0.06, bkTopY, bkZ);
  const bkTR = p(bkX + cBW * 0.94, bkTopY, bkZ);
  const bkWL = p(bkX + cBW * 0.09, bkBotY + cBH * 0.42, bkZ); // curved waist left
  const bkWR = p(bkX + cBW * 0.91, bkBotY + cBH * 0.42, bkZ); // curved waist right

  // Mesh panel corners (inset from backrest frame)
  const msbL = p(bkX + cBW * 0.09, bkBotY + cBH * 0.1, bkZ);
  const msbR = p(bkX + cBW * 0.91, bkBotY + cBH * 0.1, bkZ);
  const mstL = p(bkX + cBW * 0.12, bkTopY - cBH * 0.08, bkZ);
  const mstR = p(bkX + cBW * 0.88, bkTopY - cBH * 0.08, bkZ);
  const mswL = p(bkX + cBW * 0.14, bkBotY + cBH * 0.42, bkZ);
  const mswR = p(bkX + cBW * 0.86, bkBotY + cBH * 0.42, bkZ);

  // Lumbar support curves (behind the mesh)
  const lbMid = bkBotY + cBH * 0.32;
  const lbL = p(bkX + cBW * 0.14, lbMid, bkZ - 0.03);
  const lbR = p(bkX + cBW * 0.86, lbMid, bkZ - 0.03);
  const lbC = p(bkX + cBW * 0.5, lbMid - 0.06, bkZ - 0.03); // center forward projection

  // Curved headrest corners
  const hX = bkX + (cBW - cHW) * 0.5,
    hZ = bkZ,
    hY = bkTopY + 0.05;
  const hrBL = p(hX, hY, hZ),
    hrBR = p(hX + cHW, hY, hZ);
  const hrTR = p(hX + cHW * 0.92, hY + cHH, hZ),
    hrTL = p(hX + cHW * 0.08, hY + cHH, hZ);

  // Curved Armrests
  const arRX = cX + cSW + 0.03,
    arRZ = cZ + cSD * 0.22;
  const arLX = cX - 0.03 - cAW * 0.4,
    arLZ = cZ + cSD * 0.22;

  // Right Armrest Pad
  const arRTFL = p(arRX, cLH + cSH + cAH, arRZ),
    arRTFR = p(arRX + cAW * 0.6, cLH + cSH + cAH, arRZ);
  const arRTBR = p(arRX + cAW * 0.6, cLH + cSH + cAH, arRZ + cSD * 0.58),
    arRTBL = p(arRX, cLH + cSH + cAH, arRZ + cSD * 0.58);
  // Left Armrest Pad
  const arLTFL = p(arLX, cLH + cSH + cAH, arLZ),
    arLTFR = p(arLX + cAW * 0.4, cLH + cSH + cAH, arLZ);
  const arLTBR = p(arLX + cAW * 0.4, cLH + cSH + cAH, arLZ + cSD * 0.58),
    arLTBL = p(arLX, cLH + cSH + cAH, arLZ + cSD * 0.58);

  // Star Base & Casters
  const cyCX = cX + cSW * 0.42,
    cyCZ = cZ + cSD * 0.42;
  const cyW = 0.18,
    cyD = 0.18;
  const baseO = p(cyCX + cyW / 2, 0.05, cyCZ + cyD / 2);
  const casterR = u * 0.08;

  const spokes = Array.from({length: 5}, (_, i) => {
    const ang = (i / 5) * Math.PI * 2 - Math.PI / 2;
    return p(
      cyCX + cyW / 2 + Math.cos(ang) * 0.6,
      0.04,
      cyCZ + cyD / 2 + Math.sin(ang) * 0.6,
    );
  });

  const sw = Math.max(0.55, u * 0.038);

  // ── Dynamic calculations ───────────────────────────────────────────────────
  const shadowCx = ox + (DW / 2 - 0.8) * C30 * u * 0.9;
  const shadowCy = oy + 3;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.72}
      style={[{width: seatW, height: seatH, alignItems: 'center'}, style]}>
      <Svg width={seatW} height={seatH - labelH + 2}>
        <Defs>
          <RadialGradient
            id={`floorShadow-${seat.id}`}
            cx="50%"
            cy="50%"
            rx="50%"
            ry="50%">
            <Stop offset="0%" stopColor="#000000" stopOpacity={0.42} />
            <Stop offset="55%" stopColor="#000000" stopOpacity={0.18} />
            <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
          </RadialGradient>

          <RadialGradient
            id={`selectedGlow-${seat.id}`}
            cx="50%"
            cy="50%"
            rx="50%"
            ry="50%">
            <Stop offset="0%" stopColor={glowColor} stopOpacity={0.38} />
            <Stop offset="65%" stopColor={glowColor} stopOpacity={0.14} />
            <Stop offset="100%" stopColor={glowColor} stopOpacity={0} />
          </RadialGradient>

          <LinearGradient
            id={`chromeGrad-${seat.id}`}
            x1="0"
            y1="0"
            x2="1"
            y2="0">
            <Stop offset="0%" stopColor="#374151" />
            <Stop offset="25%" stopColor="#d1d5db" />
            <Stop offset="40%" stopColor="#ffffff" />
            <Stop offset="60%" stopColor="#9ca3af" />
            <Stop offset="80%" stopColor="#4b5563" />
            <Stop offset="100%" stopColor="#1f2937" />
          </LinearGradient>

          <LinearGradient
            id={`metalLegGrad-${seat.id}`}
            x1="0"
            y1="0"
            x2="1"
            y2="0">
            <Stop offset="0%" stopColor="#4b5563" />
            <Stop offset="45%" stopColor="#9ca3af" />
            <Stop offset="70%" stopColor="#d1d5db" />
            <Stop offset="100%" stopColor="#374151" />
          </LinearGradient>

          <LinearGradient
            id={`fabricTopGrad-${seat.id}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1">
            <Stop offset="0%" stopColor={pal.fabricLight} />
            <Stop offset="60%" stopColor={pal.fabric} />
            <Stop offset="100%" stopColor={pal.fabricDark} />
          </LinearGradient>

          <LinearGradient
            id={`fabricSideGrad-${seat.id}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1">
            <Stop offset="0%" stopColor={pal.fabric} />
            <Stop offset="100%" stopColor={pal.fabricDark} />
          </LinearGradient>

          <LinearGradient
            id={`meshGrad-${seat.id}`}
            x1="0"
            y1="0"
            x2="1"
            y2="1">
            <Stop offset="0%" stopColor={pal.fabricLight} stopOpacity={0.65} />
            <Stop offset="50%" stopColor={pal.fabric} stopOpacity={0.72} />
            <Stop offset="100%" stopColor={pal.fabricDark} stopOpacity={0.78} />
          </LinearGradient>

          <LinearGradient
            id={`frameGrad-${seat.id}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1">
            <Stop offset="0%" stopColor="#2d3748" />
            <Stop offset="100%" stopColor="#1a202c" />
          </LinearGradient>

          <LinearGradient
            id={`woodTopGrad-${seat.id}`}
            x1="0"
            y1="0"
            x2="1"
            y2="1">
            <Stop offset="0%" stopColor={pal.wood} />
            <Stop offset="100%" stopColor={pal.woodSide} />
          </LinearGradient>

          <LinearGradient
            id={`monScreenActive-${seat.id}`}
            x1="0"
            y1="0"
            x2="1"
            y2="0">
            <Stop offset="0%" stopColor="#1e3a8a" />
            <Stop offset="50%" stopColor="#3b82f6" />
            <Stop offset="100%" stopColor="#1d4ed8" />
          </LinearGradient>
        </Defs>

        <G>
          {/* Floor Shadow & Glow */}
          {(isSelected || isMyBooked) && (
            <Ellipse
              cx={shadowCx}
              cy={shadowCy}
              rx={u * 2.8}
              ry={u * 0.68}
              fill={`url(#selectedGlow-${seat.id})`}
            />
          )}
          <Ellipse
            cx={shadowCx}
            cy={shadowCy}
            rx={u * 2.2}
            ry={u * 0.52}
            fill={`url(#floorShadow-${seat.id})`}
          />

          {/* Desk Legs */}
          <Path
            d={quad(cbTFL, cbTFR, cbBFR, cbBFL)}
            fill={pal.woodSide}
            stroke={pal.edge}
            strokeWidth={sw * 0.5}
          />
          <Path
            d={quad(...legFL.right)}
            fill="url(#metalLegGrad-desk)"
            stroke={pal.edge}
            strokeWidth={sw * 0.5}
          />
          <Path
            d={quad(...legFL.front)}
            fill="url(#metalLegGrad-desk)"
            stroke={pal.edge}
            strokeWidth={sw * 0.5}
          />
          <Path
            d={quad(...legFR.right)}
            fill="url(#metalLegGrad-desk)"
            stroke={pal.edge}
            strokeWidth={sw * 0.5}
          />
          <Path
            d={quad(...legFR.front)}
            fill="url(#metalLegGrad-desk)"
            stroke={pal.edge}
            strokeWidth={sw * 0.5}
          />

          {/* Desk Surface */}
          <Path
            d={quad(dFTL, dFTR, dFBR, dFBL)}
            fill={pal.woodSide}
            stroke={pal.edge}
            strokeWidth={sw}
          />
          <Path
            d={quad(dRTL, dRTR, dRBR, dRBL)}
            fill={pal.side}
            stroke={pal.edge}
            strokeWidth={sw}
          />
          <Path
            d={quad(dTFL, dTFR, dTBR, dTBL)}
            fill={`url(#woodTopGrad-${seat.id})`}
            stroke={pal.edge}
            strokeWidth={sw}
          />

          {/* Desk highlight shimmer */}
          <Path
            d={quad(
              p(0, DH + DLH + 0.004, 0),
              p(DW * 0.18, DH + DLH + 0.004, 0),
              p(DW * 0.18, DH + DLH + 0.004, DD),
              p(0, DH + DLH + 0.004, DD),
            )}
            fill={pal.highlight}
          />
          {grain.map((g, i) => (
            <Line
              key={i}
              x1={g.a.x}
              y1={g.a.y}
              x2={g.b.x}
              y2={g.b.y}
              stroke={pal.woodSide}
              strokeWidth={sw * 0.35}
              opacity={0.4}
            />
          ))}
          <Circle
            cx={grommOuter.x}
            cy={grommOuter.y}
            r={u * 0.06}
            fill="#374151"
            stroke="#1f2937"
            strokeWidth={0.5}
          />

          {/* Monitor */}
          {hasMonitor && (
            <G>
              <Path
                d={quad(sbTFL, sbTFR, sbTBR, sbTBL)}
                fill="url(#chromeGrad-base)"
                stroke={pal.edge}
                strokeWidth={sw * 0.5}
              />
              <Path
                d={quad(sbTFL, sbTFR, sbFFL, sbFFR)}
                fill="#374151"
                stroke={pal.edge}
                strokeWidth={sw * 0.5}
              />
              <Path
                d={quad(snRTL, snRTR, snRBR, snRBL)}
                fill="#1f2937"
                stroke={pal.edge}
                strokeWidth={sw * 0.5}
              />
              <Path
                d={quad(snTFL, snTFR, snTBR, snTBL)}
                fill="url(#chromeGrad-neck)"
                stroke={pal.edge}
                strokeWidth={sw * 0.5}
              />
              <Path
                d={quad(snTFL, snTFR, snFFL, snFFR)}
                fill="#374151"
                stroke={pal.edge}
                strokeWidth={sw * 0.5}
              />
              <Path
                d={quad(mRTL, mRTR, mRBR, mRBL)}
                fill="#1e293b"
                stroke="#0f172a"
                strokeWidth={sw * 0.7}
              />
              <Path
                d={quad(mFTL, mFTR, mFBR, mFBL)}
                fill="#0f172a"
                stroke="#0f172a"
                strokeWidth={sw}
              />
              <Path
                d={quad(scTL, scTR, scBR, scBL)}
                fill={
                  isMonitorActive
                    ? `url(#monScreenActive-${seat.id})`
                    : '#1e293b'
                }
              />

              {isMonitorActive ? (
                <G>
                  <Path
                    d={quad(scTL, scTR, scBR, scBL)}
                    fill={pal.glow}
                    opacity={0.4}
                  />
                  <Circle
                    cx={
                      scTL.x +
                      (scTR.x - scTL.x) * 0.22 +
                      (scBL.x - scTL.x) * 0.22
                    }
                    cy={
                      scTL.y +
                      (scTR.y - scTL.y) * 0.22 +
                      (scBL.y - scTL.y) * 0.22
                    }
                    r={u * 0.1}
                    fill="#38bdf8"
                  />
                  {uiLines.map((l, i) => (
                    <Line
                      key={i}
                      x1={l.a.x}
                      y1={l.a.y}
                      x2={l.b.x}
                      y2={l.b.y}
                      stroke={i === 0 ? '#38bdf8' : 'rgba(255,255,255,0.72)'}
                      strokeWidth={sw * (i === 0 ? 1.4 : 0.7)}
                    />
                  ))}
                  <Line
                    x1={glare1a.x}
                    y1={glare1a.y}
                    x2={glare1b.x}
                    y2={glare1b.y}
                    stroke="rgba(255,255,255,0.35)"
                    strokeWidth={sw * 1.5}
                    strokeLinecap="round"
                  />
                </G>
              ) : (
                <G>
                  <Line
                    x1={glare1a.x}
                    y1={glare1a.y}
                    x2={glare1b.x}
                    y2={glare1b.y}
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth={sw * 1.0}
                    strokeLinecap="round"
                  />
                  <Circle
                    cx={scBR.x - u * 0.06}
                    cy={scBR.y - u * 0.05}
                    r={sw * 0.7}
                    fill={
                      isDisabled ? '#ef5350' : isBooked ? '#ffa726' : '#4caf50'
                    }
                  />
                </G>
              )}

              <Path
                d={quad(mTFL, mTFR, mTBR, mTBL)}
                fill="#334155"
                stroke="#0f172a"
                strokeWidth={sw * 0.6}
              />

              {/* Keyboard */}
              <Path
                d={quad(kbRTL, kbRTR, kbRBR, kbRBL)}
                fill="#334155"
                stroke="#1e293b"
                strokeWidth={sw * 0.5}
              />
              <Path
                d={quad(kbTFL, kbTFR, kbFFL, kbFFR)}
                fill="#1e293b"
                stroke="#1e293b"
                strokeWidth={sw * 0.55}
              />
              <Path
                d={quad(kbTFL, kbTFR, kbTBR, kbTBL)}
                fill="#475569"
                stroke="#1e293b"
                strokeWidth={sw * 0.6}
              />
              {keyRows.map((kr, i) => (
                <Line
                  key={i}
                  x1={kr.a.x}
                  y1={kr.a.y}
                  x2={kr.b.x}
                  y2={kr.b.y}
                  stroke="rgba(255,255,255,0.18)"
                  strokeWidth={sw * 0.5}
                />
              ))}
              <Path
                d={quad(tpTFL, tpTFR, tpTBR, tpTBL)}
                fill="#334155"
                stroke="rgba(255,255,255,0.10)"
                strokeWidth={sw * 0.4}
              />

              {/* Mouse */}
              <Path
                d={quad(msRTL, msRTR, msRBR, msRBL)}
                fill="#334155"
                stroke="#1e293b"
                strokeWidth={sw * 0.4}
              />
              <Path
                d={quad(msTFL, msTFR, msFFL, msFFR)}
                fill="#1e293b"
                stroke="#1e293b"
                strokeWidth={sw * 0.4}
              />
              <Path
                d={quad(msTFL, msTFR, msTBR, msTBL)}
                fill="#475569"
                stroke="#1e293b"
                strokeWidth={sw * 0.5}
              />
              <Line
                x1={(msTFL.x + msTFR.x) / 2}
                y1={(msTFL.y + msTFR.y) / 2}
                x2={(msTBL.x + msTBR.x) / 2}
                y2={(msTBL.y + msTBR.y) / 2}
                stroke="rgba(255,255,255,0.20)"
                strokeWidth={sw * 0.4}
              />
            </G>
          )}

          {/* Papers */}
          {!hasMonitor && (
            <G>
              <Path
                d={quad(s1FL, s1FR, s1BR, s1BL)}
                fill="#f8fafc"
                stroke="#e2e8f0"
                strokeWidth={sw * 0.5}
              />
              <Path
                d={quad(s2FL, s2FR, s2BR, s2BL)}
                fill="#ffffff"
                stroke="#cbd5e1"
                strokeWidth={sw * 0.5}
              />
              {[0.3, 0.5, 0.7].map((t, i) => {
                const la = {
                  x: s2FL.x + (s2FR.x - s2FL.x) * 0.1 + (s2BL.x - s2FL.x) * t,
                  y: s2FL.y + (s2FR.y - s2FL.y) * 0.1 + (s2BL.y - s2FL.y) * t,
                };
                const lb = {
                  x: s2FR.x - (s2FR.x - s2FL.x) * 0.1 + (s2BR.x - s2FR.x) * t,
                  y: s2FR.y - (s2FR.y - s2FL.y) * 0.1 + (s2BR.y - s2FR.y) * t,
                };
                return (
                  <Line
                    key={i}
                    x1={la.x}
                    y1={la.y}
                    x2={lb.x}
                    y2={lb.y}
                    stroke="#94a3b8"
                    strokeWidth={sw * 0.4}
                  />
                );
              })}
              <Line
                x1={penA.x}
                y1={penA.y}
                x2={penB.x}
                y2={penB.y}
                stroke="#475569"
                strokeWidth={sw * 1.1}
                strokeLinecap="round"
              />
              <Circle cx={penA.x} cy={penA.y} r={sw * 0.9} fill="#334155" />
            </G>
          )}

          {/* Base Spokes */}
          {spokes.map((sp, i) => (
            <G key={`spoke-${i}`}>
              <Line
                x1={baseO.x}
                y1={baseO.y}
                x2={sp.x}
                y2={sp.y}
                stroke={`url(#chromeGrad-${seat.id})`}
                strokeWidth={sw * 2.8}
                strokeLinecap="round"
              />
              <Line
                x1={baseO.x}
                y1={baseO.y - 1}
                x2={sp.x}
                y2={sp.y - 1}
                stroke="rgba(255,255,255,0.55)"
                strokeWidth={sw * 0.6}
                strokeLinecap="round"
              />
            </G>
          ))}
          <Circle
            cx={baseO.x}
            cy={baseO.y}
            r={u * 0.14}
            fill={`url(#chromeGrad-${seat.id})`}
            stroke={pal.edge}
            strokeWidth={sw * 0.5}
          />

          {/* Casters */}
          {spokes.map((sp, i) => (
            <G key={`caster-${i}`}>
              <Circle cx={sp.x} cy={sp.y} r={casterR * 1.3} fill="#1e293b" />
              <Circle
                cx={sp.x - 1.5}
                cy={sp.y}
                r={casterR * 0.9}
                fill="#475569"
              />
              <Circle
                cx={sp.x + 1.5}
                cy={sp.y}
                r={casterR * 0.9}
                fill="#334155"
              />
              <Circle cx={sp.x} cy={sp.y} r={casterR * 0.4} fill="#cbd5e1" />
            </G>
          ))}

          {/* Gas Lift */}
          <Path
            d={quad(
              p(cyCX, cLH, cyCZ),
              p(cyCX + cyW, cLH, cyCZ),
              p(cyCX + cyW, 0, cyCZ),
              p(cyCX, 0, cyCZ),
            )}
            fill={`url(#chromeGrad-${seat.id})`}
            stroke={pal.edge}
            strokeWidth={sw * 0.5}
          />
          <Path
            d={quad(
              p(cyCX + cyW, cLH, cyCZ),
              p(cyCX + cyW, cLH, cyCZ + cyD),
              p(cyCX + cyW, 0, cyCZ + cyD),
              p(cyCX + cyW, 0, cyCZ),
            )}
            fill={`url(#chromeGrad-${seat.id})`}
            stroke={pal.edge}
            strokeWidth={sw * 0.5}
          />
          <Path
            d={quad(
              p(cyCX, cLH, cyCZ),
              p(cyCX + cyW, cLH, cyCZ),
              p(cyCX + cyW, cLH, cyCZ + cyD),
              p(cyCX, cLH, cyCZ + cyD),
            )}
            fill="#e2e8f0"
            stroke={pal.edge}
            strokeWidth={sw * 0.5}
          />

          {/* Seat Cushion */}
          <Path
            d={roundedQuadPath(spBBL, spBBR, spBFR, spBFL, 0.18)}
            fill="url(#frameGrad-cushion)"
            stroke={pal.edge}
            strokeWidth={sw * 0.6}
          />
          <Path
            d={quad(spBFL, spBFR, spTFR, spTFL)}
            fill={`url(#fabricSideGrad-${seat.id})`}
            stroke={pal.edge}
            strokeWidth={sw * 0.6}
          />
          <Path
            d={quad(spBFR, spBBR, spTBR, spTFR)}
            fill={`url(#fabricSideGrad-${seat.id})`}
            stroke={pal.edge}
            strokeWidth={sw * 0.6}
          />
          <Path
            d={roundedQuadPath(spTFL, spTFR, spTBR, spTBL, 0.18)}
            fill={`url(#fabricTopGrad-${seat.id})`}
            stroke={pal.edge}
            strokeWidth={sw * 0.8}
          />
          <Path
            d={roundedQuadPath(seamTFL, seamTFR, seamTBR, seamTBL, 0.18)}
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth={sw * 0.6}
            strokeDasharray="2,2"
          />

          {/* Armrests */}
          <Path
            d={`M ${p(cX + cSW * 0.75, cLH + 0.04, cZ + cSD * 0.48).x},${
              p(cX + cSW * 0.75, cLH + 0.04, cZ + cSD * 0.48).y
            } L ${
              p(arRX + cAW * 0.3, cLH + cSH + cAH - cAD, arRZ + cSD * 0.28).x
            },${
              p(arRX + cAW * 0.3, cLH + cSH + cAH - cAD, arRZ + cSD * 0.28).y
            }`}
            stroke={`url(#chromeGrad-${seat.id})`}
            strokeWidth={sw * 1.8}
            strokeLinecap="round"
          />
          <Path
            d={`M ${p(cX + cSW * 0.12, cLH + 0.04, cZ + cSD * 0.48).x},${
              p(cX + cSW * 0.12, cLH + 0.04, cZ + cSD * 0.48).y
            } L ${
              p(arLX + cAW * 0.1, cLH + cSH + cAH - cAD, arLZ + cSD * 0.28).x
            },${
              p(arLX + cAW * 0.1, cLH + cSH + cAH - cAD, arLZ + cSD * 0.28).y
            }`}
            stroke={`url(#chromeGrad-${seat.id})`}
            strokeWidth={sw * 1.8}
            strokeLinecap="round"
          />
          <Path
            d={roundedQuadPath(arLTFL, arLTFR, arLTBR, arLTBL, 0.28)}
            fill="url(#frameGrad-arm)"
            stroke={pal.edge}
            strokeWidth={sw * 0.6}
          />
          <Path
            d={roundedQuadPath(arRTFL, arRTFR, arRTBR, arRTBL, 0.28)}
            fill="url(#frameGrad-arm)"
            stroke={pal.edge}
            strokeWidth={sw * 0.6}
          />

          {/* Chair Backrest */}
          <Path
            d={`M ${p(cX + cSW * 0.45, cLH, cZ + cSD * 0.88).x},${
              p(cX + cSW * 0.45, cLH, cZ + cSD * 0.88).y
            } L ${p(bkX + cBW * 0.5, bkBotY + cBH * 0.5, bkZ + 0.05).x},${
              p(bkX + cBW * 0.5, bkBotY + cBH * 0.5, bkZ + 0.05).y
            }`}
            stroke={`url(#chromeGrad-${seat.id})`}
            strokeWidth={sw * 2.6}
            strokeLinecap="round"
          />
          <Path
            d={`M ${bkBL.x},${bkBL.y} Q ${bkWL.x},${bkWL.y} ${bkTL.x},${
              bkTL.y
            } Q ${(bkTL.x + bkTR.x) / 2},${(bkTL.y + bkTR.y) / 2 - u * 0.08} ${
              bkTR.x
            },${bkTR.y} Q ${bkWR.x},${bkWR.y} ${bkBR.x},${bkBR.y} Z`}
            fill="url(#frameGrad-backrest)"
            stroke={pal.edge}
            strokeWidth={sw * 0.8}
          />
          <Path
            d={`M ${lbL.x},${lbL.y} Q ${lbC.x},${lbC.y} ${lbR.x},${lbR.y}`}
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth={sw * 1.5}
            strokeLinecap="round"
          />
          <Ellipse
            cx={lbC.x}
            cy={lbC.y}
            rx={u * 0.14}
            ry={u * 0.04}
            fill="rgba(255,255,255,0.22)"
          />
          <Path
            d={`M ${msbL.x},${msbL.y} Q ${mswL.x},${mswL.y} ${mstL.x},${
              mstL.y
            } Q ${(mstL.x + mstR.x) / 2},${(mstL.y + mstR.y) / 2 - u * 0.06} ${
              mstR.x
            },${mstR.y} Q ${mswR.x},${mswR.y} ${msbR.x},${msbR.y} Z`}
            fill={`url(#meshGrad-${seat.id})`}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={sw * 0.5}
          />
          <Path
            d={`M ${mswL.x + 3},${mswL.y} Q ${(mswL.x + mswR.x) / 2},${
              (mswL.y + mswR.y) / 2 - 4
            } ${mswR.x - 3},${mswR.y}`}
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth={sw * 0.7}
          />

          {/* Headrest */}
          <Line
            x1={p(bkX + cBW * 0.38, bkTopY, bkZ).x}
            y1={p(bkX + cBW * 0.38, bkTopY, bkZ).y}
            x2={hrBL.x + (hrBR.x - hrBL.x) * 0.32}
            y2={hrBL.y + (hrBR.y - hrBL.y) * 0.32}
            stroke={`url(#chromeGrad-${seat.id})`}
            strokeWidth={sw * 1.2}
          />
          <Line
            x1={p(bkX + cBW * 0.62, bkTopY, bkZ).x}
            y1={p(bkX + cBW * 0.62, bkTopY, bkZ).y}
            x2={hrBL.x + (hrBR.x - hrBL.x) * 0.68}
            y2={hrBL.y + (hrBR.y - hrBL.y) * 0.68}
            stroke={`url(#chromeGrad-${seat.id})`}
            strokeWidth={sw * 1.2}
          />
          <Path
            d={roundedQuadPath(hrBL, hrBR, hrTR, hrTL, 0.28)}
            fill="url(#frameGrad-head)"
            stroke={pal.edge}
            strokeWidth={sw * 0.7}
          />
          <Path
            d={roundedQuadPath(hrBL, hrBR, hrTR, hrTL, 0.28)}
            fill={`url(#fabricTopGrad-${seat.id})`}
            opacity={0.85}
          />
        </G>
      </Svg>

      <Text
        style={{
          fontSize: Math.max(9, labelH * 0.78),
          fontWeight: '800',
          color: colors.text,
          letterSpacing: 0.5,
          textAlign: 'center',
          marginTop: 1,
          opacity: 0.92,
        }}
        numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
