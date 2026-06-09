import React from 'react';
import {TouchableOpacity, Text, View} from 'react-native';
import Svg, {
  Rect,
  Ellipse,
  Line,
  G,
  Circle,
  Path,
  Defs,
  LinearGradient,
  Stop,
  RadialGradient,
} from 'react-native-svg';
import {COLORS} from '../../theme/colors';

/**
 * WorkstationSeatCell — SIDE VIEW office workstation illustration.
 *
 * Upgraded to D-Level Premium Ergonomic Office Chair:
 *   - Contoured cushion with waterfall front edge.
 *   - Ergonomic S-shaped backrest profile representing spinal curvature.
 *   - Sleek looping armrests with chrome detailing.
 *   - Polished chrome star base, cylinder, and casters.
 *   - Wood-grain desk surface and state-driven monitor display.
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
  if (!seat) {
    return <View style={[{width: seatW, height: seatH}, style]} />;
  }

  const hasMonitor = !!seat.has_monitor;
  const label = seat.floor?.name
    ? `${seat.floor.name}-${seat.label}`
    : seat.label;
  const labelH = Math.max(11, seatH * 0.2);
  const boxPad = 4;
  const svgH = seatH - labelH - boxPad * 2 - 4;
  const svgW = seatW - boxPad * 2;

  // ── colors ────────────────────────────────────────────────────────────────
  const sk = colors.border; // stroke
  const f20 = colors.border + '20'; // ghost fill
  const f70 = colors.border + '70';

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

  // ── Build a rich 6-shade palette from booking-state border color ───────────
  const pal = (() => {
    const [r, g, b] = toRgb(colors.border);
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
    };
  })();

  // ── layout: chair on left ~45%, desk on right ~55% ────────────────────────
  const chairW = svgW * 0.44;
  const deskAreaX = svgW * 0.46;
  const deskAreaW = svgW * 0.54;

  // ── CHAIR SIDE VIEW proportions ───────────────────────────────────────────
  const floorY = svgH * 0.93;

  // base / wheel cluster
  const baseW = chairW * 0.82;
  const baseH = svgH * 0.055;
  const baseX = chairW * 0.09;
  const baseY = floorY - baseH;

  // wheels
  const wheelR = svgH * 0.028;
  const wheelPositions = [0.15, 0.5, 0.85].map(t => ({
    cx: baseX + baseW * t,
    cy: floorY - wheelR * 0.5,
  }));

  // gas lift
  const cylW = chairW * 0.12;
  const cylH = svgH * 0.2;
  const cylX = baseX + baseW * 0.5 - cylW / 2;
  const cylY = baseY - cylH;

  // seat cushion
  const seatCushW = chairW * 0.8;
  const seatCushH = svgH * 0.12;
  const seatCushX = chairW * 0.05;
  const seatCushY = cylY - seatCushH * 0.6;

  // Ergonomic backrest spine & mesh curve
  const backW2 = chairW * 0.22;
  const backH2 = svgH * 0.44;
  const backX2 = seatCushX + seatCushW * 0.72;
  const backBottomY = seatCushY + seatCushH * 0.4;
  const backTopY = backBottomY - backH2;
  const recline = chairW * 0.06;

  // headrest
  const hW = chairW * 0.28;
  const hH = svgH * 0.1;
  const hX = backX2 + recline - hW * 0.2;
  const hY = backTopY - hH - svgH * 0.03;

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
  const monH2 = svgH * 0.3;
  const monX2 = deskSurfX + deskSurfW * 0.28;
  const monBottomY = deskSurfY;
  const monTopY = monBottomY - monH2;
  const monStandW2 = monW2 * 0.1;
  const monStandH2 = svgH * 0.055;
  const monStandX2 = monX2 + monW2 / 2 - monStandW2 / 2;
  const monBaseW = monW2 * 0.35;
  const monBaseX = monX2 + monW2 / 2 - monBaseW / 2;

  // keyboard
  const kbW2 = deskSurfW * 0.55;
  const kbH3 = deskSurfH * 0.55;
  const kbX2 = deskSurfX + deskSurfW * 0.18;
  const kbY2 = deskSurfY - kbH3;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        {
          width: seatW,
          height: seatH,
          alignItems: 'center',
          justifyContent: 'flex-start',
        },
        style,
      ]}>
      <View
        style={{
          width: seatW,
          height: seatH - labelH - 2,
          borderWidth: 1.5,
          borderColor: colors.border,
          borderRadius: 12,
          backgroundColor: colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          // glow shadow driven by seat state color
          shadowColor: colors.border,
          shadowOffset: {width: 0, height: 2},
          shadowOpacity: 0.22,
          shadowRadius: 6,
          elevation: 3,
        }}>
        <Svg width={svgW} height={svgH}>
          <Defs>
            {/* Ambient Radial Shadow under base */}
            <RadialGradient
              id={`floorShadow-side-${seat.id}`}
              cx="50%"
              cy="50%"
              rx="50%"
              ry="50%">
              <Stop offset="0%" stopColor="#000000" stopOpacity={0.35} />
              <Stop offset="70%" stopColor="#000000" stopOpacity={0.12} />
              <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
            </RadialGradient>

            {/* Active Status Glow under workstation */}
            <RadialGradient
              id={`selectedGlow-side-${seat.id}`}
              cx="50%"
              cy="50%"
              rx="50%"
              ry="50%">
              <Stop offset="0%" stopColor={glowColor} stopOpacity={0.35} />
              <Stop offset="70%" stopColor={glowColor} stopOpacity={0.12} />
              <Stop offset="100%" stopColor={glowColor} stopOpacity={0} />
            </RadialGradient>

            {/* Chrome metallic finish */}
            <LinearGradient
              id={`chromeGrad-side-${seat.id}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1">
              <Stop offset="0%" stopColor="#4b5563" />
              <Stop offset="25%" stopColor="#d1d5db" />
              <Stop offset="50%" stopColor="#ffffff" />
              <Stop offset="75%" stopColor="#9ca3af" />
              <Stop offset="100%" stopColor="#1f2937" />
            </LinearGradient>

            {/* Brushed metal for legs */}
            <LinearGradient
              id={`metalLegGrad-side-${seat.id}`}
              x1="0"
              y1="0"
              x2="1"
              y2="0">
              <Stop offset="0%" stopColor="#4b5563" />
              <Stop offset="50%" stopColor="#9ca3af" />
              <Stop offset="100%" stopColor="#374151" />
            </LinearGradient>

            {/* Cushion top gradient */}
            <LinearGradient
              id={`fabricTopGrad-side-${seat.id}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1">
              <Stop offset="0%" stopColor={pal.fabricLight} />
              <Stop offset="60%" stopColor={pal.fabric} />
              <Stop offset="100%" stopColor={pal.fabricDark} />
            </LinearGradient>

            {/* Backrest fabric gradient */}
            <LinearGradient
              id={`fabricBackGrad-side-${seat.id}`}
              x1="0"
              y1="0"
              x2="1"
              y2="1">
              <Stop offset="0%" stopColor={pal.fabricLight} stopOpacity={0.7} />
              <Stop offset="50%" stopColor={pal.fabric} stopOpacity={0.75} />
              <Stop
                offset="100%"
                stopColor={pal.fabricDark}
                stopOpacity={0.8}
              />
            </LinearGradient>

            {/* Wood top gradient */}
            <LinearGradient
              id={`woodTopGrad-side-${seat.id}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1">
              <Stop offset="0%" stopColor={pal.wood} />
              <Stop offset="100%" stopColor={pal.woodSide} />
            </LinearGradient>

            {/* Active monitor screen */}
            <LinearGradient
              id={`monScreenActive-side-${seat.id}`}
              x1="0"
              y1="0"
              x2="1"
              y2="1">
              <Stop offset="0%" stopColor="#1e3a8a" />
              <Stop offset="60%" stopColor="#3b82f6" />
              <Stop offset="100%" stopColor="#1d4ed8" />
            </LinearGradient>
          </Defs>

          {/* ─── 0. FLOOR GLOW HALO ───────────────────────────────────────── */}
          {(isSelected || isMyBooked) && (
            <Ellipse
              cx={svgW * 0.5}
              cy={floorY}
              rx={svgW * 0.48}
              ry={svgH * 0.08}
              fill={`url(#selectedGlow-side-${seat.id})`}
            />
          )}
          <Ellipse
            cx={svgW * 0.5}
            cy={floorY}
            rx={svgW * 0.4}
            ry={svgH * 0.05}
            fill={`url(#floorShadow-side-${seat.id})`}
          />

          {/* ─── DESK (Upgraded styling) ─────────────────────────────────── */}
          {/* Desk legs */}
          <Rect
            x={legLX}
            y={legTopY}
            width={legW2}
            height={legH2}
            rx={1}
            fill="url(#metalLegGrad-side-desk)"
          />
          <Rect
            x={legRX}
            y={legTopY}
            width={legW2}
            height={legH2}
            rx={1}
            fill="url(#metalLegGrad-side-desk)"
          />

          {/* Desk surface */}
          <Rect
            x={deskSurfX}
            y={deskSurfY}
            width={deskSurfW}
            height={deskSurfH}
            rx={2}
            fill={`url(#woodTopGrad-side-${seat.id})`}
            stroke={sk}
            strokeWidth={1.6}
          />
          {/* desk surface top highlight */}
          <Rect
            x={deskSurfX + 1}
            y={deskSurfY + 1}
            width={deskSurfW - 2}
            height={deskSurfH * 0.35}
            rx={1}
            fill={f20}
          />

          {hasMonitor ? (
            <G>
              {/* Monitor bezel */}
              <Rect
                x={monX2}
                y={monTopY}
                width={monW2}
                height={monH2}
                rx={2}
                fill="#0f172a"
                stroke="#0f172a"
                strokeWidth={1.5}
              />
              {/* Screen area — dark lit display or standby glass */}
              <Rect
                x={monX2 + monW2 * 0.07}
                y={monTopY + monH2 * 0.09}
                width={monW2 * 0.86}
                height={monH2 * 0.74}
                rx={1}
                fill={
                  isMonitorActive
                    ? `url(#monScreenActive-side-${seat.id})`
                    : '#1e293b'
                }
              />

              {/* Dynamic screen display */}
              {isMonitorActive ? (
                <G>
                  {/* Screen glare active */}
                  <Line
                    x1={monX2 + monW2 * 0.14}
                    y1={monTopY + monH2 * 0.16}
                    x2={monX2 + monW2 * 0.48}
                    y2={monTopY + monH2 * 0.12}
                    stroke="rgba(255,255,255,0.35)"
                    strokeWidth={1.5}
                  />
                  {/* Mock chart lines */}
                  <Line
                    x1={monX2 + monW2 * 0.2}
                    y1={monTopY + monH2 * 0.5}
                    x2={monX2 + monW2 * 0.8}
                    y2={monTopY + monH2 * 0.5}
                    stroke="#38bdf8"
                    strokeWidth={1.2}
                  />
                  <Line
                    x1={monX2 + monW2 * 0.3}
                    y1={monTopY + monH2 * 0.68}
                    x2={monX2 + monW2 * 0.7}
                    y2={monTopY + monH2 * 0.68}
                    stroke="#e2e8f0"
                    strokeWidth={0.8}
                  />
                </G>
              ) : (
                <G>
                  {/* Screen glare standby */}
                  <Line
                    x1={monX2 + monW2 * 0.14}
                    y1={monTopY + monH2 * 0.16}
                    x2={monX2 + monW2 * 0.42}
                    y2={monTopY + monH2 * 0.12}
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth={1.2}
                  />
                  {/* Standby LED */}
                  <Circle
                    cx={monX2 + monW2 * 0.85}
                    cy={monBottomY - monH2 * 0.15}
                    r={0.9}
                    fill={
                      isDisabled ? '#ef5350' : isBooked ? '#ffa726' : '#4caf50'
                    }
                  />
                </G>
              )}

              {/* Monitor stand neck */}
              <Rect
                x={monStandX2}
                y={monBottomY}
                width={monStandW2}
                height={monStandH2}
                fill="url(#chromeGrad-side-neck)"
              />
              {/* Monitor stand base on desk */}
              <Rect
                x={monBaseX}
                y={monBottomY + monStandH2 - 2}
                width={monBaseW}
                height={svgH * 0.025}
                rx={1}
                fill="#475569"
              />
              {/* Keyboard flat on desk */}
              <Rect
                x={kbX2}
                y={kbY2}
                width={kbW2}
                height={kbH3}
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
                x={deskSurfX + deskSurfW * 0.14}
                y={deskSurfY - deskSurfH * 0.6}
                width={deskSurfW * 0.55}
                height={deskSurfH * 0.55}
                rx={1}
                fill="#ffffff"
                stroke="#cbd5e1"
                strokeWidth={0.8}
              />
            </G>
          )}

          {/* ─── CHAIR (Ergonomic Side View Upgrade) ─────────────────────── */}

          {/* Spine support frame (behind cushion & backrest) */}
          <Path
            d={`M ${baseX + baseW * 0.5} ${baseY} L ${backX2 + backW2 * 0.5} ${
              backBottomY + backH2 * 0.3
            }`}
            stroke="url(#chromeGrad-side-spine)"
            strokeWidth={1.8}
            strokeLinecap="round"
          />

          {/* Star Spoke Base (Curved Profile) */}
          <Path
            d={`M ${baseX} ${baseY + baseH * 0.5} Q ${baseX + baseW * 0.5} ${
              baseY - 2
            } ${baseX + baseW} ${baseY + baseH * 0.5}`}
            fill="none"
            stroke="url(#chromeGrad-side-base)"
            strokeWidth={3}
            strokeLinecap="round"
          />

          {/* Wheels (Casters) */}
          {wheelPositions.map((w, i) => (
            <G key={`wheel-${i}`}>
              <Circle cx={w.cx} cy={w.cy} r={wheelR * 1.2} fill="#1e293b" />
              <Circle cx={w.cx} cy={w.cy} r={wheelR * 0.5} fill="#d1d5db" />
            </G>
          ))}

          {/* Gas lift cylinder */}
          <Rect
            x={cylX}
            y={cylY}
            width={cylW}
            height={cylH}
            fill="url(#chromeGrad-side-cyl)"
            stroke={sk}
            strokeWidth={0.8}
          />
          <Rect
            x={cylX + cylW * 0.15}
            y={cylY}
            width={cylW * 0.25}
            height={cylH}
            fill="#ffffff"
            opacity={0.35}
          />

          {/* Seat cushion (Rounded contoured profile with waterfall edge facing left) */}
          <Path
            d={`
              M ${seatCushX + seatCushW} ${seatCushY + seatCushH}
              L ${seatCushX + seatCushH * 0.5} ${seatCushY + seatCushH}
              Q ${seatCushX} ${seatCushY + seatCushH} ${seatCushX} ${
              seatCushY + seatCushH * 0.55
            }
              Q ${seatCushX} ${seatCushY + 2} ${seatCushX + seatCushH * 0.5} ${
              seatCushY + 2
            }
              L ${seatCushX + seatCushW - seatCushH * 0.2} ${seatCushY + 2}
              Q ${seatCushX + seatCushW} ${seatCushY + 2} ${
              seatCushX + seatCushW
            } ${seatCushY + seatCushH * 0.4}
              Z
            `}
            fill="url(#fabricTopGrad-side-cushion)"
            stroke={sk}
            strokeWidth={1.5}
          />

          {/* Stitching seam */}
          <Path
            d={`
              M ${seatCushX + seatCushW - 2} ${seatCushY + 4}
              L ${seatCushX + seatCushH * 0.6} ${seatCushY + 4}
              Q ${seatCushX + 3} ${seatCushY + 4} ${seatCushX + 3} ${
              seatCushY + seatCushH * 0.55
            }
            `}
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth={0.8}
            strokeDasharray="2,2"
          />

          {/* Backrest (Ergonomic S-profile, mesh look) */}
          <Path
            d={`
              M ${backX2 + backW2} ${backBottomY}
              C ${backX2 + backW2 * 0.4} ${backBottomY - backH2 * 0.3} ${
              backX2 + backW2 * 0.75 + recline * 0.5
            } ${backBottomY - backH2 * 0.65} ${
              backX2 + backW2 * 0.8 + recline
            } ${backTopY + backH2 * 0.15}
              Q ${backX2 + backW2 * 0.8 + recline} ${backTopY} ${
              backX2 + backW2 * 0.2 + recline
            } ${backTopY}
              C ${backX2 + backW2 * 0.4 + recline} ${
              backTopY + backH2 * 0.25
            } ${backX2 + backW2 * 0.1} ${
              backBottomY - backH2 * 0.4
            } ${backX2} ${backBottomY}
              Z
            `}
            fill="url(#fabricBackGrad-side-backrest)"
            stroke={sk}
            strokeWidth={1.5}
          />
          {/* lumbar curve highlight inside mesh */}
          <Path
            d={`M ${backX2 + backW2 * 0.2} ${backBottomY - backH2 * 0.3} Q ${
              backX2 + backW2 * 0.45
            } ${backBottomY - backH2 * 0.48} ${backX2 + backW2 * 0.5} ${
              backBottomY - backH2 * 0.65
            }`}
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth={1.8}
            strokeLinecap="round"
          />

          {/* Armrest loop */}
          <Path
            d={`
              M ${backX2} ${seatCushY - armH3}
              Q ${armX + armW2 * 0.4} ${armY2 - 2} ${armX} ${armY2 + armH3}
              Q ${armX + armW2 * 0.2} ${seatCushY + seatCushH * 0.5} ${
              backX2 + 2
            } ${seatCushY + seatCushH * 0.2}
            `}
            fill="none"
            stroke="url(#chromeGrad-side-arm)"
            strokeWidth={1.5}
          />
          {/* Armrest Soft Pad */}
          <Rect
            x={armX}
            y={armY2}
            width={armW2}
            height={armH3}
            rx={armH3 / 2}
            fill="#1e293b"
            stroke={sk}
            strokeWidth={1.0}
          />

          {/* Headrest (Contoured pillow + chrome support) */}
          <Line
            x1={backX2 + backW2 * 0.5 + recline}
            y1={backTopY}
            x2={hX + hW * 0.5}
            y2={hY + hH * 0.5}
            stroke="url(#chromeGrad-side-head)"
            strokeWidth={1.4}
          />
          <Rect
            x={hX}
            y={hY}
            width={hW}
            height={hH}
            rx={hH * 0.4}
            fill="url(#fabricTopGrad-side-cushion)"
            stroke={sk}
            strokeWidth={1.0}
          />
        </Svg>
      </View>

      {/* Label */}
      <Text
        style={{
          fontSize: Math.max(10, labelH * 0.8),
          fontWeight: '700',
          color: colors.text,
          letterSpacing: 0.4,
          marginTop: 4,
          textAlign: 'center',
          opacity: 0.85,
        }}
        numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// Parse hex/rgba color helper
function toRgb(col) {
  if (!col) {
    return [80, 60, 200];
  }
  if (col.startsWith('rgba') || col.startsWith('rgb')) {
    const m = col.match(/[\d.]+/g);
    return m ? [+m[0], +m[1], +m[2]] : [80, 60, 200];
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
