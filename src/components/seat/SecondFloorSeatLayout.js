import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { COLORS } from '../../theme/colors';

// ─── Base dimensions ──────────────────────────────────────────────────────────
const SEAT_W = 72;
const SEAT_H = 44;
const GAP_X = 10;
const BLOCK_GAP = 36;
const SECTION_GAP = 20;
const MR_SCALE = 0.75;

// ─── Sort seats by display_order, then label numeric, then id ─────────────────
function sortSeats(seats) {
  return [...seats].sort((a, b) => {
    const orderA = a.display_order ?? a.order ?? a.position ?? 9999;
    const orderB = b.display_order ?? b.order ?? b.position ?? 9999;
    if (orderA !== orderB) return orderA - orderB;

    const numA = parseInt((a.label || '').replace(/\D/g, ''), 10);
    const numB = parseInt((b.label || '').replace(/\D/g, ''), 10);
    if (!isNaN(numA) && !isNaN(numB) && numA !== numB) return numA - numB;

    const strCmp = (a.label || '').localeCompare(b.label || '');
    if (strCmp !== 0) return strCmp;

    return String(a.id).localeCompare(String(b.id));
  });
}

// ─── Standard seat colour ─────────────────────────────────────────────────────
function getSeatColor(seat, selectedSeatId, myBookedSeatId, userEmail) {
  const isMyBooked =
    seat.booking?.user_email === userEmail || seat.id === myBookedSeatId;
  const isSelected = seat.id === selectedSeatId;
  const isBooked = !!seat.booking;
  const isDisabled = !seat.enabled;

  if (isMyBooked)
    return { bg: COLORS.myBookingBg, border: COLORS.myBookingBorder, text: COLORS.myBookingText };
  if (isSelected)
    return { bg: COLORS.seatSelectedBase, border: COLORS.seatSelectedAccent, text: '#fff' };
  if (isDisabled)
    return { bg: COLORS.seatDisabledBase, border: COLORS.seatDisabledAccent, text: COLORS.seatDisabledAccent };
  if (isBooked)
    return { bg: COLORS.seatBookedBase, border: COLORS.seatBookedAccent, text: COLORS.seatBookedAccent };
  return { bg: COLORS.seatAvailableBase, border: COLORS.seatAvailableAccent, text: COLORS.seatAvailableAccent };
}

// ─── Meeting room seat colour (orange/amber scheme) ───────────────────────────
// When any standard seat is still available, meeting seats appear disabled.
function getMeetingSeatColor(seat, selectedSeatId, myBookedSeatId, userEmail, hasAvailableStandard) {
  const isMyBooked =
    seat.booking?.user_email === userEmail || seat.id === myBookedSeatId;
  const isSelected = seat.id === selectedSeatId;
  const isBooked = !!seat.booking;
  const isDisabled = !seat.enabled || hasAvailableStandard;

  if (isMyBooked)
    return { bg: COLORS.myBookingBg, border: COLORS.myBookingBorder, text: COLORS.myBookingText };
  if (isSelected)
    return { bg: COLORS.meetingSelectedBase, border: COLORS.meetingSelectedAccent, text: COLORS.meetingSelectedAccent };
  if (isDisabled)
    return { bg: COLORS.meetingDisabledBase, border: COLORS.meetingDisabledAccent, text: COLORS.meetingDisabledAccent };
  if (isBooked)
    return { bg: COLORS.meetingBookedBase, border: COLORS.meetingBookedAccent, text: COLORS.meetingBookedAccent };
  return { bg: COLORS.meetingAvailableBase, border: COLORS.meetingAvailableAccent, text: COLORS.meetingAvailableAccent };
}

// ─── Single seat cell ─────────────────────────────────────────────────────────
function SeatCell({
  seat,
  selectedSeatId,
  myBookedSeatId,
  userEmail,
  onSeatPress,
  onBookedSeatPress,
  seatW,
  seatH,
  isMeeting = false,
  hasAvailableStandard = false,
  style,
}) {
  if (!seat) return <View style={[{ width: seatW, height: seatH }, style]} />;

  const colors = isMeeting
    ? getMeetingSeatColor(seat, selectedSeatId, myBookedSeatId, userEmail, hasAvailableStandard)
    : getSeatColor(seat, selectedSeatId, myBookedSeatId, userEmail);

  const isMyBooked =
    seat.booking?.user_email === userEmail || seat.id === myBookedSeatId;
  const isOtherBooked = !!seat.booking && !isMyBooked;
  const isTouchDisabled = isMeeting
    ? (!seat.enabled || hasAvailableStandard)
    : !seat.enabled;

  const label = seat.floor?.name ? `${seat.floor.name}-${seat.label}` : seat.label;

  const handlePress = () => {
    if (isTouchDisabled) return;
    if (isOtherBooked) {
      onBookedSeatPress && onBookedSeatPress(seat);
    } else {
      onSeatPress && onSeatPress(seat.id);
    }
  };

  return (
    <TouchableOpacity
      style={[
        {
          width: seatW,
          height: seatH,
          borderRadius: 6,
          borderWidth: 2,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.bg,
          borderColor: colors.border,
        },
        style,
      ]}
      onPress={handlePress}
      disabled={isTouchDisabled}
      activeOpacity={0.75}
    >
      <Text
        style={{ fontSize: Math.max(9, seatH * 0.28), fontWeight: '700', color: colors.text }}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {label}
      </Text>
      {seat.has_monitor && (
        <View
          style={{
            position: 'absolute',
            top: 3,
            right: 3,
            width: 7,
            height: 7,
            borderRadius: 3.5,
            backgroundColor: COLORS.monitorBadge,
          }}
        />
      )}
    </TouchableOpacity>
  );
}

// ─── Horizontal row of seats ──────────────────────────────────────────────────
function SeatRow({
  seatList,
  gap,
  seatW,
  seatH,
  selectedSeatId,
  myBookedSeatId,
  userEmail,
  onSeatPress,
  onBookedSeatPress,
  isMeeting = false,
  hasAvailableStandard = false,
}) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {seatList.map((seat, idx) => (
        <SeatCell
          key={seat ? seat.id : `empty-${idx}`}
          seat={seat}
          selectedSeatId={selectedSeatId}
          myBookedSeatId={myBookedSeatId}
          userEmail={userEmail}
          onSeatPress={onSeatPress}
          onBookedSeatPress={onBookedSeatPress}
          seatW={seatW}
          seatH={seatH}
          isMeeting={isMeeting}
          hasAvailableStandard={hasAvailableStandard}
          style={idx > 0 ? { marginLeft: gap } : undefined}
        />
      ))}
    </View>
  );
}

// ─── Back-to-back 4-seat bank (facing pair, no gap between rows) ──────────────
function SeatBank({
  topRow,
  bottomRow,
  gap,
  seatW,
  seatH,
  selectedSeatId,
  myBookedSeatId,
  userEmail,
  onSeatPress,
  onBookedSeatPress,
}) {
  const rowProps = { gap, seatW, seatH, selectedSeatId, myBookedSeatId, userEmail, onSeatPress, onBookedSeatPress };
  return (
    <View>
      <SeatRow seatList={topRow} {...rowProps} />
      <SeatRow seatList={bottomRow} {...rowProps} />
    </View>
  );
}

// ─── Meeting room card (label + gray background + 2 rows of seats) ────────────
function MeetingRoomCard({
  label,
  topRow,
  bottomRow,
  gap,
  seatW,
  seatH,
  selectedSeatId,
  myBookedSeatId,
  userEmail,
  onSeatPress,
  onBookedSeatPress,
  hasAvailableStandard,
}) {
  const rowProps = {
    gap,
    seatW,
    seatH,
    selectedSeatId,
    myBookedSeatId,
    userEmail,
    onSeatPress,
    onBookedSeatPress,
    isMeeting: true,
    hasAvailableStandard,
  };
  return (
    <View>
      <Text style={styles.mrLabel}>{label}</Text>
      <View style={styles.mrCard}>
        <SeatRow seatList={topRow} {...rowProps} />
        <View style={{ height: gap }} />
        <SeatRow seatList={bottomRow} {...rowProps} />
      </View>
    </View>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function SecondFloorSeatLayout({
  seats = [],
  selectedSeatId,
  onSeatPress,
  onBookedSeatPress,
  myBookedSeatId,
  userEmail,
}) {
  const screenWidth = Dimensions.get('window').width;
  const scale = Math.max(0.55, Math.min(1, screenWidth / 420));

  const seatW = SEAT_W * scale;
  const seatH = SEAT_H * scale;
  const gapX = GAP_X * scale;
  const blockGap = BLOCK_GAP * scale;
  const sectionGap = SECTION_GAP * scale;

  const mrSeatW = seatW * MR_SCALE;
  const mrSeatH = seatH * MR_SCALE;
  const mrGapX = gapX * MR_SCALE;

  // ── Sort, then slice in display order ─────────────────────────────────────
  const sorted = sortSeats(seats);

  // Standard open seats
  const row1 = sorted.slice(0, 6);          // Row 1: 6 seats, right-aligned

  const blockATop = sorted.slice(6, 10);    // Block A top row (facing south)
  const blockABottom = sorted.slice(10, 14);// Block A bottom row (facing north)

  const blockBTop = sorted.slice(14, 18);   // Block B top row (facing south)
  const blockBBottom = sorted.slice(18, 22);// Block B bottom row (facing north)

  // Meeting room seats
  const mr1Top = sorted.slice(22, 24);      // MR1: 2 seats
  const mr1Bottom = sorted.slice(24, 26);   // MR1: 2 seats

  const mr2Top = sorted.slice(26, 29);      // MR2: 3 seats
  const mr2Bottom = sorted.slice(29, 32);   // MR2: 3 seats

  const mr3Top = sorted.slice(32, 34);      // MR3: 2 seats
  const mr3Bottom = sorted.slice(34, 36);   // MR3: 2 seats

  // ── Is any standard seat still bookable? ─────────────────────────────────
  const hasAvailableStandard = sorted
    .slice(0, 22)
    .some((s) => s && s.enabled && !s.booking);

  // ── Shared props ──────────────────────────────────────────────────────────
  const cp = { selectedSeatId, myBookedSeatId, userEmail, onSeatPress, onBookedSeatPress };

  // ── Right column width = max(row1, blockRow) so both right-align cleanly ──
  const blockRowWidth = 4 * seatW + 3 * gapX;
  const row1Width = 6 * seatW + 5 * gapX;
  const rightColWidth = Math.max(row1Width, blockRowWidth);

  // ── Meeting room card widths (for MR3 alignment) ──────────────────────────
  // MR1/MR2 have 2 columns → width = 2*mrSeatW + mrGapX
  // MR3 has 2 columns → same

  const mrCardGap = sectionGap; // horizontal gap between MR left-col and MR3

  return (
    <View style={styles.wrapper}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator
          contentContainerStyle={{ padding: 16 }}
        >
          {/* ── Top section: standard seat right column ────────────────── */}
          <View style={{ alignItems: 'flex-start' }}>

            {/* Row 1 + Blocks right-aligned */}
            <View style={{ width: rightColWidth, alignSelf: 'flex-end' }}>
              {/* Row 1 */}
              <View style={{ alignSelf: 'flex-end' }}>
                <SeatRow
                  seatList={row1}
                  gap={gapX}
                  seatW={seatW}
                  seatH={seatH}
                  {...cp}
                />
              </View>

              <View style={{ height: sectionGap }} />

              {/* Block A */}
              <View style={{ alignSelf: 'flex-end' }}>
                <SeatBank
                  topRow={blockATop}
                  bottomRow={blockABottom}
                  gap={gapX}
                  seatW={seatW}
                  seatH={seatH}
                  {...cp}
                />
              </View>

              <View style={{ height: blockGap }} />

              {/* Block B */}
              <View style={{ alignSelf: 'flex-end' }}>
                <SeatBank
                  topRow={blockBTop}
                  bottomRow={blockBBottom}
                  gap={gapX}
                  seatW={seatW}
                  seatH={seatH}
                  {...cp}
                />
              </View>
            </View>

            <View style={{ height: blockGap }} />

            {/* ── Meeting rooms section ──────────────────────────────────── */}
            {/* Layout: [MR1 over MR2] [gap] [MR3 aligned to MR2 vertically] */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>

              {/* Left meeting column: MR1 above MR2 */}
              <View style={{ flexDirection: 'column' }}>
                <MeetingRoomCard
                  label="Meeting Room 1"
                  topRow={mr1Top}
                  bottomRow={mr1Bottom}
                  gap={mrGapX}
                  seatW={mrSeatW}
                  seatH={mrSeatH}
                  hasAvailableStandard={hasAvailableStandard}
                  {...cp}
                />

                <View style={{ height: sectionGap }} />

                <MeetingRoomCard
                  label="Meeting Room 2"
                  topRow={mr2Top}
                  bottomRow={mr2Bottom}
                  gap={mrGapX}
                  seatW={mrSeatW}
                  seatH={mrSeatH}
                  hasAvailableStandard={hasAvailableStandard}
                  {...cp}
                />
              </View>

              {/* Gap between left MR column and MR3 */}
              <View style={{ width: mrCardGap }} />

              {/* Right meeting column: MR3 — aligned to bottom of left column (MR2 Y) */}
              <MeetingRoomCard
                label="Meeting Room 3"
                topRow={mr3Top}
                bottomRow={mr3Bottom}
                gap={mrGapX}
                seatW={mrSeatW}
                seatH={mrSeatH}
                hasAvailableStandard={hasAvailableStandard}
                {...cp}
              />
            </View>

          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: COLORS.bgLight,
  },
  mrLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1b5e20',
    marginBottom: 4,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  mrCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 8,
  },
});
