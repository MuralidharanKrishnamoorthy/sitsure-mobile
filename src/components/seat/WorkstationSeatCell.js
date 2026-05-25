import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import Svg, { Rect, Ellipse, Line, G, Circle, Path } from 'react-native-svg';

/**
 * WorkstationSeatCell — SIDE VIEW office workstation illustration.
 *
 * Layout (left→right in SVG):
 *   [chair side view]  [desk with monitor OR empty desk]
 *
 * Chair side view:
 *   - 5-wheel rolling base (ellipse + 5 small circles)
 *   - gas lift cylinder (thin vertical rect)
 *   - seat cushion (rounded rect)
 *   - backrest (tall rounded rect, slightly reclined)
 *   - armrest (small horizontal rect)
 *
 * Desk side view:
 *   - desk surface (horizontal rect)
 *   - desk legs (2 thin rects)
 *   - if monitor: monitor on desk (rect + stand)
 *   - if no monitor: empty surface
 *
 * No outer bounding box. State colors tint all parts.
 */
export function WorkstationSeatCell({
  seat,
  colors,
  seatW,
  seatH,
  onPress,
  disabled,
  style,
}) {
  if (!seat) return <View style={[{ width: seatW, height: seatH }, style]} />;

  const hasMonitor = !!seat.has_monitor;
  const label = seat.floor?.name ? `${seat.floor.name}-${seat.label}` : seat.label;
  const labelH = Math.max(11, seatH * 0.20);
  const boxPad = 4;
  const svgH = seatH - labelH - boxPad * 2 - 4;
  const svgW = seatW - boxPad * 2;

  // ── colors ────────────────────────────────────────────────────────────────
  const sk = colors.border;          // stroke
  const fill = colors.bg;            // main fill (desk/backrest/armrests)
  const f20 = colors.border + '20';  // ghost fill
  const f40 = colors.border + '40';
  const f70 = colors.border + '70';
  const fcc = colors.border + 'cc';  // strong

  // ── fixed realistic colors (independent of booking state) ─────────────────
  // Monitor screen — dark charcoal like a real display
  const monScreenBg   = '#2c3340';
  const monScreenLit  = '#3d4f6b';
  const monBezelColor = '#4a5568';
  const monGlare      = 'rgba(255,255,255,0.22)';
  // Chair seat cushion — warm charcoal fabric
  const cushionFill   = '#6b7280';
  const cushionSeam   = 'rgba(255,255,255,0.18)';

  // ── layout: chair on left ~45%, desk on right ~55% ────────────────────────
  const chairW = svgW * 0.44;
  const deskAreaX = svgW * 0.46;
  const deskAreaW = svgW * 0.54;

  // ── CHAIR SIDE VIEW proportions ───────────────────────────────────────────
  // floor baseline
  const floorY = svgH * 0.93;

  // base / wheel cluster
  const baseW = chairW * 0.82;
  const baseH = svgH * 0.055;
  const baseX = chairW * 0.09;
  const baseY = floorY - baseH;

  // 5 wheels below base (small circles)
  const wheelR = svgH * 0.028;
  const wheelPositions = [0.12, 0.30, 0.50, 0.70, 0.88].map(t => ({
    cx: baseX + baseW * t,
    cy: floorY - wheelR * 0.5,
  }));

  // gas lift / cylinder
  const cylW = chairW * 0.12;
  const cylH = svgH * 0.20;
  const cylX = baseX + baseW * 0.5 - cylW / 2;
  const cylY = baseY - cylH;

  // seat cushion
  const seatCushW = chairW * 0.80;
  const seatCushH = svgH * 0.12;
  const seatCushX = chairW * 0.05;
  const seatCushY = cylY - seatCushH * 0.6;

  // backrest — tall, slightly angled using path
  const backW2 = chairW * 0.22;
  const backH2 = svgH * 0.44;
  const backX2 = seatCushX + seatCushW * 0.72;
  const backBottomY = seatCushY + seatCushH * 0.4;
  const backTopY = backBottomY - backH2;
  // slight recline: top leans back by a few px
  const recline = chairW * 0.06;

  // armrest
  const armW2 = chairW * 0.35;
  const armH3 = svgH * 0.045;
  const armX = backX2 - armW2 * 0.9;
  const armY2 = seatCushY - armH3 * 0.3;

  // ── DESK SIDE VIEW proportions ────────────────────────────────────────────
  const deskSurfH = svgH * 0.07;
  const deskSurfY = svgH * 0.42;
  const deskSurfX = deskAreaX;
  const deskSurfW = deskAreaW * 0.92;

  // desk legs
  const legW2 = deskAreaW * 0.055;
  const legH2 = floorY - (deskSurfY + deskSurfH);
  const legLX = deskSurfX + deskAreaW * 0.08;
  const legRX = deskSurfX + deskSurfW - legW2 - deskAreaW * 0.08;
  const legTopY = deskSurfY + deskSurfH;

  // monitor on desk
  const monW2 = deskSurfW * 0.46;
  const monH2 = svgH * 0.30;
  const monX2 = deskSurfX + deskSurfW * 0.28;
  const monBottomY = deskSurfY;
  const monTopY = monBottomY - monH2;
  const monStandW2 = monW2 * 0.10;
  const monStandH2 = svgH * 0.055;
  const monStandX2 = monX2 + monW2 / 2 - monStandW2 / 2;
  const monBaseW = monW2 * 0.35;
  const monBaseX = monX2 + monW2 / 2 - monBaseW / 2;

  // keyboard on desk surface
  const kbW2 = deskSurfW * 0.55;
  const kbH3 = deskSurfH * 0.55;
  const kbX2 = deskSurfX + deskSurfW * 0.18;
  const kbY2 = deskSurfY - kbH3;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[{ width: seatW, height: seatH, alignItems: 'center', justifyContent: 'flex-start' }, style]}
    >
      {/* Square bordered box containing the furniture illustration */}
      <View
        style={{
          width: seatW,
          height: seatH - labelH - 2,
          borderWidth: 2,
          borderColor: colors.border,
          borderRadius: 8,
          backgroundColor: colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
      <Svg width={svgW} height={svgH}>

        {/* ═══ DESK ═══════════════════════════════════════════════════════════ */}

        {/* Desk legs */}
        <Rect x={legLX} y={legTopY} width={legW2} height={legH2} rx={1} fill={f70} />
        <Rect x={legRX} y={legTopY} width={legW2} height={legH2} rx={1} fill={f70} />

        {/* Desk surface */}
        <Rect
          x={deskSurfX} y={deskSurfY}
          width={deskSurfW} height={deskSurfH}
          rx={2}
          fill={fill}
          stroke={sk}
          strokeWidth={1.6}
        />
        {/* desk surface top highlight */}
        <Rect
          x={deskSurfX + 1} y={deskSurfY + 1}
          width={deskSurfW - 2} height={deskSurfH * 0.35}
          rx={1}
          fill={f20}
        />

        {hasMonitor ? (
          <G>
            {/* Monitor bezel */}
            <Rect
              x={monX2} y={monTopY}
              width={monW2} height={monH2}
              rx={2}
              fill={monBezelColor}
              stroke={monBezelColor}
              strokeWidth={1.5}
            />
            {/* Screen area — dark lit display */}
            <Rect
              x={monX2 + monW2 * 0.07} y={monTopY + monH2 * 0.09}
              width={monW2 * 0.86} height={monH2 * 0.74}
              rx={1}
              fill={monScreenLit}
            />
            {/* Screen glare */}
            <Line
              x1={monX2 + monW2 * 0.14} y1={monTopY + monH2 * 0.16}
              x2={monX2 + monW2 * 0.42} y2={monTopY + monH2 * 0.12}
              stroke={monGlare} strokeWidth={1.3}
            />
            {/* Monitor stand neck */}
            <Rect
              x={monStandX2} y={monBottomY}
              width={monStandW2} height={monStandH2}
              fill={fcc}
            />
            {/* Monitor stand base on desk */}
            <Rect
              x={monBaseX} y={monBottomY + monStandH2 - 2}
              width={monBaseW} height={svgH * 0.025}
              rx={1}
              fill={fcc}
            />
            {/* Keyboard flat on desk */}
            <Rect
              x={kbX2} y={kbY2}
              width={kbW2} height={kbH3}
              rx={1}
              fill={f20}
              stroke={f70}
              strokeWidth={0.8}
            />
          </G>
        ) : (
          <G>
            {/* Empty desk — papers/notebook flat on surface */}
            <Rect
              x={deskSurfX + deskSurfW * 0.14} y={deskSurfY - deskSurfH * 0.6}
              width={deskSurfW * 0.55} height={deskSurfH * 0.55}
              rx={1}
              fill={f20}
              stroke={f40}
              strokeWidth={0.8}
            />
          </G>
        )}

        {/* ═══ CHAIR ══════════════════════════════════════════════════════════ */}

        {/* Backrest — slightly reclined trapezoid via path */}
        <Path
          d={`
            M ${backX2 + recline} ${backTopY}
            L ${backX2 + backW2 + recline} ${backTopY}
            L ${backX2 + backW2} ${backBottomY}
            L ${backX2} ${backBottomY}
            Z
          `}
          fill={fill}
          stroke={sk}
          strokeWidth={1.5}
        />
        {/* Backrest inner cushion seam */}
        <Path
          d={`
            M ${backX2 + recline + backW2 * 0.18} ${backTopY + backH2 * 0.1}
            L ${backX2 + backW2 * 0.82 + recline} ${backTopY + backH2 * 0.1}
            L ${backX2 + backW2 * 0.82} ${backBottomY - backH2 * 0.1}
            L ${backX2 + backW2 * 0.18} ${backBottomY - backH2 * 0.1}
            Z
          `}
          fill="none"
          stroke={f70}
          strokeWidth={0.8}
        />
        {/* Backrest lumbar curve hint */}
        <Path
          d={`M ${backX2 + recline * 0.5 + 1} ${backTopY + backH2 * 0.55} Q ${backX2 + backW2 * 0.5} ${backTopY + backH2 * 0.6} ${backX2 + backW2 + recline * 0.5 - 1} ${backTopY + backH2 * 0.55}`}
          fill="none"
          stroke={f40}
          strokeWidth={1}
        />

        {/* Armrest */}
        <Rect
          x={armX} y={armY2}
          width={armW2} height={armH3}
          rx={armH3 / 2}
          fill={f40}
          stroke={sk}
          strokeWidth={1}
        />

        {/* Seat cushion — fixed fabric color */}
        <Rect
          x={seatCushX} y={seatCushY}
          width={seatCushW} height={seatCushH}
          rx={seatCushH * 0.45}
          fill={cushionFill}
          stroke={sk}
          strokeWidth={1.5}
        />
        {/* seat cushion highlight seam */}
        <Rect
          x={seatCushX + seatCushW * 0.1} y={seatCushY + seatCushH * 0.15}
          width={seatCushW * 0.8} height={seatCushH * 0.3}
          rx={seatCushH * 0.15}
          fill={cushionSeam}
        />

        {/* Gas lift cylinder */}
        <Rect
          x={cylX} y={cylY}
          width={cylW} height={cylH}
          fill={fcc}
          stroke={sk}
          strokeWidth={0.8}
        />
        {/* cylinder highlight */}
        <Rect
          x={cylX + cylW * 0.15} y={cylY}
          width={cylW * 0.25} height={cylH}
          fill={fill}
          opacity={0.3}
        />

        {/* 5-spoke wheel base (side view = thin ellipse + 5 wheel circles) */}
        <Ellipse
          cx={baseX + baseW / 2} cy={baseY + baseH / 2}
          rx={baseW / 2} ry={baseH / 2}
          fill={f40}
          stroke={sk}
          strokeWidth={1}
        />
        {/* wheels */}
        {wheelPositions.map((w, i) => (
          <Circle
            key={i}
            cx={w.cx} cy={w.cy}
            r={wheelR}
            fill={f70}
            stroke={sk}
            strokeWidth={0.8}
          />
        ))}

      </Svg>
      </View>

      {/* Label — bigger, below the box */}
      <Text
        style={{
          fontSize: Math.max(10, labelH * 0.82),
          fontWeight: '800',
          color: colors.text,
          letterSpacing: 0.2,
          marginTop: 3,
          textAlign: 'center',
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
