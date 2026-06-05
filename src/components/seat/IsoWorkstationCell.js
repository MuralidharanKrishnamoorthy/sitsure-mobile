import React from 'react';
import {TouchableOpacity, View, Text} from 'react-native';
import Svg, {Path, G, Ellipse, Rect, Line, Circle, Defs, LinearGradient, Stop, RadialGradient} from 'react-native-svg';

/**
 * IsoWorkstationCell — photorealistic isometric office workstation.
 *
 * Rendering layers (back→front):
 *   1. Floor shadow / ambient occlusion ellipse
 *   2. Desk frame: 4 legs with depth + cross-bar brace
 *   3. Desk surface: 3 faces + wood-grain highlight + cable grommet
 *   4. Monitor setup OR paperwork:
 *      Monitor: stand base → neck → bezel (3 faces) → screen glow → UI mockup → glare
 *      Papers: stack of 2 offset sheets + pen
 *   5. Keyboard: top face + front edge + key-row lines + trackpad
 *   6. Mouse beside keyboard
 *   7. Chair: 5-spoke star base → casters → gas-lift → seat pan (3 faces) →
 *             armrests (both sides) → backrest (3 faces) → lumbar bulge → headrest
 *   8. Status glow ring under whole scene (selected/my-booked states)
 *
 * Isometric projection:
 *   screenX = ox + (worldX - worldZ) * cos30 * unit
 *   screenY = oy + (worldX + worldZ) * sin30 * unit - worldY * unit
 */

const C30 = 0.866025; // cos(30°)
const S30 = 0.5;      // sin(30°)

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

// Triangle path
function tri(a, b, c) {
  return `M${a.x},${a.y} L${b.x},${b.y} L${c.x},${c.y}Z`;
}

// Parse color → [r,g,b]
function toRgb(col) {
  if (!col) return [80, 60, 200];
  if (col.startsWith('rgba') || col.startsWith('rgb')) {
    const m = col.match(/[\d.]+/g);
    return m ? [+m[0], +m[1], +m[2]] : [80, 60, 200];
  }
  const h = col.replace('#', '');
  const f = h.length === 3 ? h.split('').map(c => c+c).join('') : h;
  return [parseInt(f.slice(0,2),16), parseInt(f.slice(2,4),16), parseInt(f.slice(4,6),16)];
}

function rgba(r, g, b, a=1) { return `rgba(${r|0},${g|0},${b|0},${a})`; }
function clamp(v,lo,hi)      { return Math.min(hi, Math.max(lo, v)); }

// Build a rich 6-shade palette from booking-state border color
function palette(borderColor) {
  const [r,g,b] = toRgb(borderColor);
  return {
    // Desk / object faces
    top:    rgba(clamp(r+72,0,255), clamp(g+72,0,255), clamp(b+72,0,255), 0.92),
    mid:    rgba(clamp(r+30,0,255), clamp(g+30,0,255), clamp(b+30,0,255), 0.85),
    side:   rgba(clamp(r-15,0,255), clamp(g-15,0,255), clamp(b-15,0,255), 0.82),
    dark:   rgba(clamp(r-45,0,255), clamp(g-45,0,255), clamp(b-45,0,255), 0.90),
    vdark:  rgba(clamp(r-70,0,255), clamp(g-70,0,255), clamp(b-70,0,255), 0.95),
    edge:   rgba(r, g, b, 1),
    // Wood desk surface — warm oak tint blended with state color
    wood:   rgba(clamp(r+55,0,255), clamp(g+45,0,255), clamp(b+10,0,255), 0.88),
    woodSide: rgba(clamp(r+20,0,255), clamp(g+16,0,255), clamp(b-10,0,255), 0.82),
    // Chair fabric — charcoal with subtle state tint
    fabric: rgba(clamp(r*0.35+55,0,255), clamp(g*0.35+55,0,255), clamp(b*0.35+70,0,255), 0.95),
    fabricDark: rgba(clamp(r*0.25+35,0,255), clamp(g*0.25+35,0,255), clamp(b*0.25+50,0,255), 0.95),
    fabricLight: rgba(clamp(r*0.4+90,0,255), clamp(g*0.4+85,0,255), clamp(b*0.4+100,0,255), 0.90),
    // Metal (chair base, stand)
    metal:  'rgba(90,92,98,0.90)',
    metalDark: 'rgba(55,56,62,0.95)',
    metalLight:'rgba(130,132,140,0.88)',
    // Glow / shadow
    glow:   rgba(r, g, b, 0.18),
    shadow: 'rgba(0,0,0,0.22)',
    highlight: rgba(clamp(r+100,0,255), clamp(g+100,0,255), clamp(b+100,0,255), 0.35),
  };
}

export function IsoWorkstationCell({seat, colors, seatW, seatH, onPress, disabled, style}) {
  if (!seat) return <View style={[{width: seatW, height: seatH}, style]} />;

  const hasMonitor = !!seat.has_monitor;
  const label = seat.floor?.name ? `${seat.floor.name}-${seat.label}` : seat.label;

  const labelH = Math.max(11, seatH * 0.17);
  const pad    = 4;
  const svgW   = seatW - pad * 2;
  const svgH   = seatH - labelH - pad * 2;

  const pal = palette(colors.border);

  // ── Scene fit ──────────────────────────────────────────────────────────────
  // World bounding box ≈ 5.8 wide × 4.2 tall in world units
  const u  = Math.min(svgW / 6.0, svgH / 4.4) * 0.90;
  const ox = svgW * 0.54;
  const oy = svgH * 0.82;
  const p  = (x,y,z) => iso(x, y, z, ox, oy, u);

  // ── Desk world dimensions ──────────────────────────────────────────────────
  const DW = 3.0, DH = 0.16, DD = 1.5, DLH = 1.1; // width, thickness, depth, leg height
  const LW = 0.11, LD = 0.11; // leg cross-section

  // Desk surface corners
  const dTFL=p(0,DH+DLH,0), dTFR=p(DW,DH+DLH,0);
  const dTBR=p(DW,DH+DLH,DD), dTBL=p(0,DH+DLH,DD);
  // Front apron face
  const dFTL=p(0,DH+DLH,0), dFTR=p(DW,DH+DLH,0);
  const dFBR=p(DW,DLH,0),   dFBL=p(0,DLH,0);
  // Right apron face
  const dRTL=p(DW,DH+DLH,0), dRTR=p(DW,DH+DLH,DD);
  const dRBR=p(DW,DLH,DD),   dRBL=p(DW,DLH,0);

  // 4 legs — front-left, front-right, back-left, back-right (only FL+FR visible)
  function leg(lx, lz) {
    return {
      front: [p(lx,DLH,lz), p(lx+LW,DLH,lz), p(lx+LW,0,lz), p(lx,0,lz)],
      right: [p(lx+LW,DLH,lz), p(lx+LW,DLH,lz+LD), p(lx+LW,0,lz+LD), p(lx+LW,0,lz)],
      top:   [p(lx,DLH,lz), p(lx+LW,DLH,lz), p(lx+LW,DLH,lz+LD), p(lx,DLH,lz+LD)],
    };
  }
  const legFL = leg(0.18, 0.14);
  const legFR = leg(DW-LW-0.18, 0.14);
  // Cross-bar brace (low horizontal, front face)
  const cbY = DLH * 0.38;
  const cbTFL=p(0.22,cbY+0.06,0.14), cbTFR=p(DW-0.22,cbY+0.06,0.14);
  const cbBFL=p(0.22,cbY,0.14),      cbBFR=p(DW-0.22,cbY,0.14);

  // Desk surface wood-grain lines (3 subtle lines across top)
  const grain = [0.28, 0.50, 0.72].map(t => ({
    a: p(DW*t, DH+DLH+0.005, 0),
    b: p(DW*t, DH+DLH+0.005, DD),
  }));

  // Cable grommet hole on desk surface (near back-right)
  const grX=DW*0.72, grZ=DD*0.62;
  const grommOuter = p(grX, DH+DLH+0.01, grZ);

  // ── Monitor setup ──────────────────────────────────────────────────────────
  const mX=DW*0.30, mZ=DD*0.28, mW=1.3, mH=0.95, mD=0.07;
  const deskY = DH+DLH;

  // Stand base (wide trapezoid)
  const sbW=0.52, sbD=0.28, sbH=0.04;
  const sbX=mX+mW/2-sbW/2, sbZ=mZ+mD/2-sbD/2;
  const sbTFL=p(sbX,deskY+sbH,sbZ),      sbTFR=p(sbX+sbW,deskY+sbH,sbZ);
  const sbTBR=p(sbX+sbW,deskY+sbH,sbZ+sbD), sbTBL=p(sbX,deskY+sbH,sbZ+sbD);
  const sbFFL=p(sbX,deskY,sbZ),           sbFFR=p(sbX+sbW,deskY,sbZ);

  // Stand neck
  const snW=0.13, snD=0.10, snH=0.28;
  const snX=mX+mW/2-snW/2, snZ=mZ+mD/2-snD/2;
  const snTFL=p(snX,deskY+sbH+snH,snZ),      snTFR=p(snX+snW,deskY+sbH+snH,snZ);
  const snTBR=p(snX+snW,deskY+sbH+snH,snZ+snD), snTBL=p(snX,deskY+sbH+snH,snZ+snD);
  const snFFL=p(snX,deskY+sbH,snZ),           snFFR=p(snX+snW,deskY+sbH,snZ);
  const snRTL=p(snX+snW,deskY+sbH+snH,snZ),  snRTR=p(snX+snW,deskY+sbH+snH,snZ+snD);
  const snRBR=p(snX+snW,deskY+sbH,snZ+snD),  snRBL=p(snX+snW,deskY+sbH,snZ);

  // Monitor bezel — 3 faces
  const monBotY=deskY+sbH+snH, monTopY=monBotY+mH;
  // Front face (main screen face)
  const mFTL=p(mX,monTopY,mZ),   mFTR=p(mX+mW,monTopY,mZ);
  const mFBR=p(mX+mW,monBotY,mZ), mFBL=p(mX,monBotY,mZ);
  // Right face
  const mRTL=p(mX+mW,monTopY,mZ),   mRTR=p(mX+mW,monTopY,mZ+mD);
  const mRBR=p(mX+mW,monBotY,mZ+mD), mRBL=p(mX+mW,monBotY,mZ);
  // Top face
  const mTFL=p(mX,monTopY,mZ),     mTFR=p(mX+mW,monTopY,mZ);
  const mTBR=p(mX+mW,monTopY,mZ+mD), mTBL=p(mX,monTopY,mZ+mD);

  // Screen inset (bezel margin ~6%)
  const bm=0.06;
  const scTL={x:mFTL.x+(mFTR.x-mFTL.x)*bm+((mFBL.x-mFTL.x)*bm),
              y:mFTL.y+(mFTR.y-mFTL.y)*bm+(mFBL.y-mFTL.y)*bm};
  const scTR={x:mFTR.x-(mFTR.x-mFTL.x)*bm+(mFBR.x-mFTR.x)*bm,
              y:mFTR.y-(mFTR.y-mFTL.y)*bm+(mFBR.y-mFTR.y)*bm};
  const scBR={x:mFBR.x-(mFBR.x-mFBL.x)*bm-(mFTR.x-mFBR.x)*bm,
              y:mFBR.y-(mFBR.y-mFBL.y)*bm-(mFTR.y-mFBR.y)*bm};
  const scBL={x:mFBL.x+(mFBR.x-mFBL.x)*bm-(mFTL.x-mFBL.x)*bm,
              y:mFBL.y+(mFBR.y-mFBL.y)*bm-(mFTL.y-mFBL.y)*bm};

  // UI mockup lines on screen (3 horizontal bars = app window illusion)
  const uiLines=[0.25,0.48,0.68].map(t=>({
    a:{x:scTL.x+(scBL.x-scTL.x)*t+(scTR.x-scTL.x)*0.07,
       y:scTL.y+(scBL.y-scTL.y)*t+(scTR.y-scTL.y)*0.07},
    b:{x:scTR.x+(scBR.x-scTR.x)*t-(scTR.x-scTL.x)*0.07,
       y:scTR.y+(scBR.y-scTR.y)*t-(scTR.y-scTL.y)*0.07},
  }));

  // Glare diagonal on screen
  const glare1a={x:scTL.x+(scTR.x-scTL.x)*0.08+(scBL.x-scTL.x)*0.1,
                 y:scTL.y+(scTR.y-scTL.y)*0.08+(scBL.y-scTL.y)*0.1};
  const glare1b={x:scTL.x+(scTR.x-scTL.x)*0.38+(scBL.x-scTL.x)*0.06,
                 y:scTL.y+(scTR.y-scTL.y)*0.38+(scBL.y-scTL.y)*0.06};

  // ── Keyboard ──────────────────────────────────────────────────────────────
  const kbX=mX-0.22, kbZ=mZ+mD+0.18, kbW=0.95, kbD=0.40, kbH=0.038;
  const kbTFL=p(kbX,deskY+kbH,kbZ),      kbTFR=p(kbX+kbW,deskY+kbH,kbZ);
  const kbTBR=p(kbX+kbW,deskY+kbH,kbZ+kbD), kbTBL=p(kbX,deskY+kbH,kbZ+kbD);
  const kbFFL=p(kbX,deskY,kbZ),           kbFFR=p(kbX+kbW,deskY,kbZ);
  const kbRTL=p(kbX+kbW,deskY+kbH,kbZ),  kbRTR=p(kbX+kbW,deskY+kbH,kbZ+kbD);
  const kbRBR=p(kbX+kbW,deskY,kbZ+kbD),  kbRBL=p(kbX+kbW,deskY,kbZ);
  // Key rows (4 lines)
  const keyRows=[0.22,0.42,0.62,0.80].map(t=>({
    a:{x:kbTFL.x+(kbTFR.x-kbTFL.x)*0.06+(kbTBL.x-kbTFL.x)*t,
       y:kbTFL.y+(kbTFR.y-kbTFL.y)*0.06+(kbTBL.y-kbTFL.y)*t},
    b:{x:kbTFR.x-(kbTFR.x-kbTFL.x)*0.06+(kbTBR.x-kbTFR.x)*t,
       y:kbTFR.y-(kbTFR.y-kbTFL.y)*0.06+(kbTBR.y-kbTFR.y)*t},
  }));
  // Trackpad
  const tpX=kbX+kbW*0.30, tpZ=kbZ+kbD*0.18, tpW=kbW*0.40, tpD=kbD*0.52;
  const tpTFL=p(tpX,deskY+kbH+0.008,tpZ),      tpTFR=p(tpX+tpW,deskY+kbH+0.008,tpZ);
  const tpTBR=p(tpX+tpW,deskY+kbH+0.008,tpZ+tpD), tpTBL=p(tpX,deskY+kbH+0.008,tpZ+tpD);

  // ── Mouse ─────────────────────────────────────────────────────────────────
  const msX=kbX+kbW+0.18, msZ=kbZ+kbD*0.15, msW=0.25, msD=0.35, msH=0.05;
  const msTFL=p(msX,deskY+msH,msZ),      msTFR=p(msX+msW,deskY+msH,msZ);
  const msTBR=p(msX+msW,deskY+msH,msZ+msD), msTBL=p(msX,deskY+msH,msZ+msD);
  const msFFL=p(msX,deskY,msZ),           msFFR=p(msX+msW,deskY,msZ);
  const msRTL=p(msX+msW,deskY+msH,msZ),  msRTR=p(msX+msW,deskY+msH,msZ+msD);
  const msRBR=p(msX+msW,deskY,msZ+msD),  msRBL=p(msX+msW,deskY,msZ);

  // ── Papers (no-monitor version) ───────────────────────────────────────────
  const pp1X=DW*0.28, pp1Z=DD*0.28, pp1W=0.80, pp1D=0.55;
  const pp2X=pp1X+0.07, pp2Z=pp1Z+0.04, pp2W=pp1W*0.85, pp2D=pp1D*0.9;
  // Sheet 1 (bottom)
  const s1FL=p(pp1X,deskY+0.02,pp1Z),       s1FR=p(pp1X+pp1W,deskY+0.02,pp1Z);
  const s1BR=p(pp1X+pp1W,deskY+0.02,pp1Z+pp1D), s1BL=p(pp1X,deskY+0.02,pp1Z+pp1D);
  // Sheet 2 (top, offset)
  const s2FL=p(pp2X,deskY+0.038,pp2Z),      s2FR=p(pp2X+pp2W,deskY+0.038,pp2Z);
  const s2BR=p(pp2X+pp2W,deskY+0.038,pp2Z+pp2D), s2BL=p(pp2X,deskY+0.038,pp2Z+pp2D);
  // Pen on paper
  const penAX=pp2X+pp2W*0.12, penAZ=pp2Z+pp2D*0.3;
  const penBX=pp2X+pp2W*0.82, penBZ=pp2Z+pp2D*0.22;
  const penA=p(penAX,deskY+0.055,penAZ);
  const penB=p(penBX,deskY+0.055,penBZ);

  // ── Chair ─────────────────────────────────────────────────────────────────
  const cX=-1.65, cZ=DD*0.12;
  const cSW=1.15, cSD=1.15, cSH=0.13; // seat pan
  const cLH=0.88;                       // leg height (to seat bottom)
  const cBH=1.35, cBW=0.95, cBD=0.16;  // backrest
  const cAH=0.28, cAW=0.48, cAD=0.10;  // armrest
  const cHW=0.65, cHD=0.12, cHH=0.22;  // headrest

  // Seat pan — 3 faces
  const spTFL=p(cX,cLH+cSH,cZ),         spTFR=p(cX+cSW,cLH+cSH,cZ);
  const spTBR=p(cX+cSW,cLH+cSH,cZ+cSD), spTBL=p(cX,cLH+cSH,cZ+cSD);
  const spFTL=p(cX,cLH+cSH,cZ),         spFTR=p(cX+cSW,cLH+cSH,cZ);
  const spFBR=p(cX+cSW,cLH,cZ),         spFBL=p(cX,cLH,cZ);
  const spRTL=p(cX+cSW,cLH+cSH,cZ),     spRTR=p(cX+cSW,cLH+cSH,cZ+cSD);
  const spRBR=p(cX+cSW,cLH,cZ+cSD),     spRBL=p(cX+cSW,cLH,cZ);

  // Seat cushion stitching seam
  const seamInset=0.12;
  const seamTFL=p(cX+cSW*seamInset, cLH+cSH+0.005, cZ+cSD*seamInset);
  const seamTFR=p(cX+cSW*(1-seamInset), cLH+cSH+0.005, cZ+cSD*seamInset);
  const seamTBR=p(cX+cSW*(1-seamInset), cLH+cSH+0.005, cZ+cSD*(1-seamInset));
  const seamTBL=p(cX+cSW*seamInset, cLH+cSH+0.005, cZ+cSD*(1-seamInset));

  // Backrest — 3 faces + lumbar curve
  const bkBotY=cLH+cSH, bkTopY=cLH+cSH+cBH;
  const bkX=cX+(cSW-cBW)*0.5, bkZ=cZ+cSD-cBD;
  const bkTFL=p(bkX,bkTopY,bkZ),       bkTFR=p(bkX+cBW,bkTopY,bkZ);
  const bkTBR=p(bkX+cBW,bkTopY,bkZ+cBD), bkTBL=p(bkX,bkTopY,bkZ+cBD);
  const bkFTL=p(bkX,bkTopY,bkZ),       bkFTR=p(bkX+cBW,bkTopY,bkZ);
  const bkFBR=p(bkX+cBW,bkBotY,bkZ),   bkFBL=p(bkX,bkBotY,bkZ);
  const bkRTL=p(bkX+cBW,bkTopY,bkZ),   bkRTR=p(bkX+cBW,bkTopY,bkZ+cBD);
  const bkRBR=p(bkX+cBW,bkBotY,bkZ+cBD), bkRBL=p(bkX+cBW,bkBotY,bkZ);
  // Backrest inner panel (slightly recessed)
  const bpX=bkX+cBW*0.1, bpZ=bkZ+0.01, bpW=cBW*0.80;
  const bpTL=p(bpX,bkTopY-cBH*0.08,bpZ), bpTR=p(bpX+bpW,bkTopY-cBH*0.08,bpZ);
  const bpBR=p(bpX+bpW,bkBotY+cBH*0.06,bpZ), bpBL=p(bpX,bkBotY+cBH*0.06,bpZ);
  // Lumbar support bulge midpoint line
  const lbMid=bkBotY+cBH*0.32;
  const lbL=p(bkX+cBW*0.08,lbMid,bkZ), lbR=p(bkX+cBW*0.92,lbMid,bkZ);

  // Headrest
  const hX=bkX+(cBW-cHW)*0.5, hZ=bkZ, hY=bkTopY+0.06;
  const hrTFL=p(hX,hY+cHH,hZ),       hrTFR=p(hX+cHW,hY+cHH,hZ);
  const hrTBR=p(hX+cHW,hY+cHH,hZ+cHD), hrTBL=p(hX,hY+cHH,hZ+cHD);
  const hrFTL=p(hX,hY+cHH,hZ),       hrFTR=p(hX+cHW,hY+cHH,hZ);
  const hrFBR=p(hX+cHW,hY,hZ),       hrFBL=p(hX,hY,hZ);

  // Neck post connecting backrest top to headrest
  const npX=bkX+cBW*0.38, npW=cBW*0.24;
  const npTL=p(npX,hY,bkZ),          npTR=p(npX+npW,hY,bkZ);
  const npBR=p(npX+npW,bkTopY,bkZ),  npBL=p(npX,bkTopY,bkZ);

  // Armrests (both sides)
  // Right armrest (iso-right = +X side)
  const arRX=cX+cSW+0.04, arRZ=cZ+cSD*0.18;
  const arRTFL=p(arRX,cLH+cSH+cAH,arRZ),      arRTFR=p(arRX+cAW,cLH+cSH+cAH,arRZ);
  const arRTBR=p(arRX+cAW,cLH+cSH+cAH,arRZ+cSD*0.64), arRTBL=p(arRX,cLH+cSH+cAH,arRZ+cSD*0.64);
  const arRFTL=p(arRX,cLH+cSH+cAH,arRZ),      arRFTR=p(arRX+cAW,cLH+cSH+cAH,arRZ);
  const arRFBR=p(arRX+cAW,cLH+cSH+cAH-cAD,arRZ), arRFBL=p(arRX,cLH+cSH+cAH-cAD,arRZ);
  // Left armrest (+Z side)
  const arLX=cX-0.06, arLZ=cZ+cSD*0.18;
  const arLTFL=p(arLX,cLH+cSH+cAH,arLZ),      arLTFR=p(arLX+cAW*0.40,cLH+cSH+cAH,arLZ);
  const arLTBR=p(arLX+cAW*0.40,cLH+cSH+cAH,arLZ+cSD*0.64), arLTBL=p(arLX,cLH+cSH+cAH,arLZ+cSD*0.64);
  const arLFTL=p(arLX,cLH+cSH+cAH,arLZ),      arLFTR=p(arLX+cAW*0.40,cLH+cSH+cAH,arLZ);
  const arLFBR=p(arLX+cAW*0.40,cLH+cSH+cAH-cAD,arLZ), arLFBL=p(arLX,cLH+cSH+cAH-cAD,arLZ);

  // Gas lift cylinder
  const cyCX=cX+cSW*0.42, cyCZ=cZ+cSD*0.42;
  const cyW=0.18, cyD=0.18;
  const cyTFL=p(cyCX,cLH,cyCZ),         cyTFR=p(cyCX+cyW,cLH,cyCZ);
  const cyTBR=p(cyCX+cyW,cLH,cyCZ+cyD), cyTBL=p(cyCX,cLH,cyCZ+cyD);
  const cyFFL=p(cyCX,0,cyCZ),            cyFFR=p(cyCX+cyW,0,cyCZ);
  const cyRTL=p(cyCX+cyW,cLH,cyCZ),     cyRTR=p(cyCX+cyW,cLH,cyCZ+cyD);
  const cyRBR=p(cyCX+cyW,0,cyCZ+cyD),   cyRBL=p(cyCX+cyW,0,cyCZ);

  // 5-spoke star base — compute 5 spoke tips isometrically
  const baseO=p(cyCX+cyW/2, 0.04, cyCZ+cyD/2);
  const bR=u*0.68;
  const spokes=Array.from({length:5},(_,i)=>{
    const ang = (i/5)*Math.PI*2 - Math.PI/2;
    // project a flat disc: x+r*cos, z+r*sin at y=0
    return p(cyCX+cyW/2 + Math.cos(ang)*0.62, 0.04, cyCZ+cyD/2 + Math.sin(ang)*0.62);
  });
  const casterR = u * 0.09;

  // ── Stroke width ──────────────────────────────────────────────────────────
  const sw = Math.max(0.55, u * 0.038);

  // ── Shadow ellipse under whole scene ─────────────────────────────────────
  const shadowCx = ox + (DW/2 - 0.8) * C30 * u * 0.9;
  const shadowCy = oy + 3;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.72}
      style={[{width: seatW, height: seatH, alignItems: 'center'}, style]}>

      <Svg width={seatW} height={seatH - labelH + 2}>
        <G>
          {/* ─── 1. FLOOR SHADOW ─────────────────────────────────────────── */}
          <Ellipse cx={shadowCx} cy={shadowCy} rx={u*2.4} ry={u*0.55}
            fill={pal.shadow} opacity={0.35} />

          {/* ─── 2. DESK LEGS ────────────────────────────────────────────── */}
          {/* Cross-bar */}
          <Path d={quad(cbTFL,cbTFR,cbBFR,cbBFL)} fill={pal.woodSide} stroke={pal.edge} strokeWidth={sw*0.5} />
          {/* Front-left leg */}
          <Path d={quad(...legFL.right)} fill={pal.vdark}     stroke={pal.edge} strokeWidth={sw*0.6} />
          <Path d={quad(...legFL.front)} fill={pal.dark}      stroke={pal.edge} strokeWidth={sw*0.6} />
          {/* Front-right leg */}
          <Path d={quad(...legFR.right)} fill={pal.vdark}     stroke={pal.edge} strokeWidth={sw*0.6} />
          <Path d={quad(...legFR.front)} fill={pal.dark}      stroke={pal.edge} strokeWidth={sw*0.6} />

          {/* ─── 3. DESK SURFACE ─────────────────────────────────────────── */}
          <Path d={quad(dFTL,dFTR,dFBR,dFBL)} fill={pal.woodSide} stroke={pal.edge} strokeWidth={sw} />
          <Path d={quad(dRTL,dRTR,dRBR,dRBL)} fill={pal.side}     stroke={pal.edge} strokeWidth={sw} />
          <Path d={quad(dTFL,dTFR,dTBR,dTBL)} fill={pal.wood}     stroke={pal.edge} strokeWidth={sw} />
          {/* Desk top highlight shimmer (front-left strip) */}
          <Path d={quad(
            p(0,DH+DLH+0.004,0), p(DW*0.18,DH+DLH+0.004,0),
            p(DW*0.18,DH+DLH+0.004,DD), p(0,DH+DLH+0.004,DD)
          )} fill={pal.highlight} />
          {/* Wood grain */}
          {grain.map((g,i)=>(
            <Line key={i} x1={g.a.x} y1={g.a.y} x2={g.b.x} y2={g.b.y}
              stroke={pal.woodSide} strokeWidth={sw*0.35} opacity={0.5} />
          ))}

          {/* ─── 4a. MONITOR SETUP ───────────────────────────────────────── */}
          {hasMonitor && (<G>
            {/* Stand base top + front */}
            <Path d={quad(sbTFL,sbTFR,sbTBR,sbTBL)} fill={pal.metal}     stroke={pal.edge} strokeWidth={sw*0.55} />
            <Path d={quad(sbTFL,sbTFR,sbFFL,sbFFR)}  fill={pal.metalDark} stroke={pal.edge} strokeWidth={sw*0.5}  />
            {/* Stand neck */}
            <Path d={quad(snRTL,snRTR,snRBR,snRBL)} fill={pal.metalDark} stroke={pal.edge} strokeWidth={sw*0.5} />
            <Path d={quad(snTFL,snTFR,snTBR,snTBL)} fill={pal.metal}     stroke={pal.edge} strokeWidth={sw*0.5} />
            <Path d={quad(snTFL,snTFR,snFFL,snFFR)}  fill={pal.metalDark} stroke={pal.edge} strokeWidth={sw*0.5} />
            {/* Monitor right face */}
            <Path d={quad(mRTL,mRTR,mRBR,mRBL)}
              fill={'rgba(28,28,38,0.92)'} stroke={pal.edge} strokeWidth={sw} />
            {/* Monitor front face — bezel */}
            <Path d={quad(mFTL,mFTR,mFBR,mFBL)}
              fill={'rgba(22,22,32,0.96)'} stroke={pal.edge} strokeWidth={sw} />
            {/* Screen active area */}
            <Path d={quad(scTL,scTR,scBR,scBL)}
              fill={'rgba(18,28,52,0.97)'} />
            {/* Screen glow ambient */}
            <Path d={quad(scTL,scTR,scBR,scBL)}
              fill={pal.glow} opacity={0.6} />
            {/* UI mockup bars */}
            {uiLines.map((l,i)=>(
              <Line key={i} x1={l.a.x} y1={l.a.y} x2={l.b.x} y2={l.b.y}
                stroke={`rgba(100,160,255,0.${i===0?'55':'30'})`}
                strokeWidth={sw * (i===0 ? 1.1 : 0.65)} />
            ))}
            {/* Screen glare */}
            <Line x1={glare1a.x} y1={glare1a.y} x2={glare1b.x} y2={glare1b.y}
              stroke="rgba(255,255,255,0.28)" strokeWidth={sw*1.2}
              strokeLinecap="round" />
            {/* Monitor top face */}
            <Path d={quad(mTFL,mTFR,mTBR,mTBL)}
              fill={'rgba(32,32,42,0.80)'} stroke={pal.edge} strokeWidth={sw*0.7} />

            {/* Keyboard top + front + right */}
            <Path d={quad(kbRTL,kbRTR,kbRBR,kbRBL)} fill={'rgba(55,57,65,0.85)'} stroke={pal.edge} strokeWidth={sw*0.55} />
            <Path d={quad(kbTFL,kbTFR,kbFFL,kbFFR)}  fill={'rgba(48,50,58,0.88)'} stroke={pal.edge} strokeWidth={sw*0.6} />
            <Path d={quad(kbTFL,kbTFR,kbTBR,kbTBL)}  fill={'rgba(62,64,72,0.90)'} stroke={pal.edge} strokeWidth={sw*0.7} />
            {/* Key rows */}
            {keyRows.map((kr,i)=>(
              <Line key={i} x1={kr.a.x} y1={kr.a.y} x2={kr.b.x} y2={kr.b.y}
                stroke="rgba(255,255,255,0.12)" strokeWidth={sw*0.5} />
            ))}
            {/* Trackpad */}
            <Path d={quad(tpTFL,tpTFR,tpTBR,tpTBL)}
              fill={'rgba(75,77,88,0.82)'} stroke="rgba(255,255,255,0.10)" strokeWidth={sw*0.4} />

            {/* Mouse top + front + right */}
            <Path d={quad(msRTL,msRTR,msRBR,msRBL)} fill={'rgba(55,57,65,0.82)'} stroke={pal.edge} strokeWidth={sw*0.5} />
            <Path d={quad(msTFL,msTFR,msFFL,msFFR)}  fill={'rgba(48,50,58,0.85)'} stroke={pal.edge} strokeWidth={sw*0.5} />
            <Path d={quad(msTFL,msTFR,msTBR,msTBL)}  fill={'rgba(70,72,82,0.88)'} stroke={pal.edge} strokeWidth={sw*0.6} />
            {/* Mouse click line */}
            <Line x1={(msTFL.x+msTFR.x)/2} y1={(msTFL.y+msTFR.y)/2}
                  x2={(msTBL.x+msTBR.x)/2} y2={(msTBL.y+msTBR.y)/2}
              stroke="rgba(255,255,255,0.15)" strokeWidth={sw*0.4} />
          </G>)}

          {/* ─── 4b. PAPERS (no monitor) ─────────────────────────────────── */}
          {!hasMonitor && (<G>
            <Path d={quad(s1FL,s1FR,s1BR,s1BL)} fill={'rgba(240,238,230,0.88)'} stroke={pal.edge} strokeWidth={sw*0.5} />
            <Path d={quad(s2FL,s2FR,s2BR,s2BL)} fill={'rgba(252,250,242,0.92)'} stroke={pal.edge} strokeWidth={sw*0.55} />
            {/* Lines on paper */}
            {[0.3,0.5,0.7].map((t,i)=>{
              const la={x:s2FL.x+(s2FR.x-s2FL.x)*0.1+(s2BL.x-s2FL.x)*t,
                        y:s2FL.y+(s2FR.y-s2FL.y)*0.1+(s2BL.y-s2FL.y)*t};
              const lb={x:s2FR.x-(s2FR.x-s2FL.x)*0.1+(s2BR.x-s2FR.x)*t,
                        y:s2FR.y-(s2FR.y-s2FL.y)*0.1+(s2BR.y-s2FR.y)*t};
              return <Line key={i} x1={la.x} y1={la.y} x2={lb.x} y2={lb.y}
                stroke="rgba(180,185,200,0.6)" strokeWidth={sw*0.4} />;
            })}
            {/* Pen */}
            <Line x1={penA.x} y1={penA.y} x2={penB.x} y2={penB.y}
              stroke={pal.edge} strokeWidth={sw*1.1} strokeLinecap="round" />
            <Circle cx={penA.x} cy={penA.y} r={sw*0.9} fill={pal.dark} />
          </G>)}

          {/* ─── 5. CHAIR BASE ───────────────────────────────────────────── */}
          {/* 5-spoke star base */}
          {spokes.map((sp,i)=>(
            <Line key={i} x1={baseO.x} y1={baseO.y} x2={sp.x} y2={sp.y}
              stroke={pal.metalDark} strokeWidth={sw*1.5} strokeLinecap="round" />
          ))}
          {/* Base center hub */}
          <Circle cx={baseO.x} cy={baseO.y} r={u*0.14}
            fill={pal.metal} stroke={pal.metalDark} strokeWidth={sw*0.6} />
          {/* 5 casters */}
          {spokes.map((sp,i)=>(
            <Circle key={i} cx={sp.x} cy={sp.y} r={casterR}
              fill={pal.metalLight} stroke={pal.metalDark} strokeWidth={sw*0.5} />
          ))}

          {/* Gas lift — right + front + top */}
          <Path d={quad(cyRTL,cyRTR,cyRBR,cyRBL)} fill={pal.metalDark} stroke={pal.edge} strokeWidth={sw*0.6} />
          <Path d={quad(cyTFL,cyTFR,cyFFR,cyFFL)} fill={pal.metal}     stroke={pal.edge} strokeWidth={sw*0.6} />
          <Path d={quad(cyTFL,cyTFR,cyTBR,cyTBL)} fill={pal.metalLight} stroke={pal.edge} strokeWidth={sw*0.5} />

          {/* ─── 6. CHAIR SEAT PAN ───────────────────────────────────────── */}
          <Path d={quad(spFTL,spFTR,spFBR,spFBL)} fill={pal.fabricDark}  stroke={pal.edge} strokeWidth={sw} />
          <Path d={quad(spRTL,spRTR,spRBR,spRBL)} fill={pal.fabric}      stroke={pal.edge} strokeWidth={sw} />
          <Path d={quad(spTFL,spTFR,spTBR,spTBL)} fill={pal.fabricLight} stroke={pal.edge} strokeWidth={sw} />
          {/* Cushion stitching seam */}
          <Path d={quad(seamTFL,seamTFR,seamTBR,seamTBL)}
            fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={sw*0.55} />

          {/* ─── 7. ARMRESTS ─────────────────────────────────────────────── */}
          {/* Right armrest */}
          <Path d={quad(arRFTL,arRFTR,arRFBR,arRFBL)} fill={pal.fabricDark}  stroke={pal.edge} strokeWidth={sw*0.7} />
          <Path d={quad(arRTFL,arRTFR,arRTBR,arRTBL)} fill={pal.fabricLight} stroke={pal.edge} strokeWidth={sw*0.7} />
          {/* Left armrest */}
          <Path d={quad(arLFTL,arLFTR,arLFBR,arLFBL)} fill={pal.fabricDark}  stroke={pal.edge} strokeWidth={sw*0.7} />
          <Path d={quad(arLTFL,arLTFR,arLTBR,arLTBL)} fill={pal.fabricLight} stroke={pal.edge} strokeWidth={sw*0.7} />

          {/* ─── 8. CHAIR BACKREST ───────────────────────────────────────── */}
          <Path d={quad(bkRTL,bkRTR,bkRBR,bkRBL)} fill={pal.fabric}      stroke={pal.edge} strokeWidth={sw} />
          <Path d={quad(bkFTL,bkFTR,bkFBR,bkFBL)} fill={pal.fabricDark}  stroke={pal.edge} strokeWidth={sw} />
          <Path d={quad(bkTFL,bkTFR,bkTBR,bkTBL)} fill={pal.fabricLight} stroke={pal.edge} strokeWidth={sw} />
          {/* Inner backrest panel */}
          <Path d={quad(bpTL,bpTR,bpBR,bpBL)}
            fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={sw*0.5} />
          {/* Lumbar support curve */}
          <Path d={`M${lbL.x},${lbL.y} Q${(lbL.x+lbR.x)/2},${lbL.y-u*0.08} ${lbR.x},${lbR.y}`}
            fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth={sw*0.8}
            strokeLinecap="round" />

          {/* ─── 9. NECK POST + HEADREST ─────────────────────────────────── */}
          <Path d={quad(npTL,npTR,npBR,npBL)} fill={pal.fabricDark} stroke={pal.edge} strokeWidth={sw*0.7} />
          <Path d={quad(hrFTL,hrFTR,hrFBR,hrFBL)} fill={pal.fabricDark}  stroke={pal.edge} strokeWidth={sw*0.8} />
          <Path d={quad(hrTFL,hrTFR,hrTBR,hrTBL)} fill={pal.fabricLight} stroke={pal.edge} strokeWidth={sw*0.8} />

        </G>
      </Svg>

      {/* Label */}
      <Text style={{
        fontSize: Math.max(9, labelH * 0.78),
        fontWeight: '800',
        color: colors.text,
        letterSpacing: 0.5,
        textAlign: 'center',
        marginTop: 1,
        opacity: 0.92,
      }} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
