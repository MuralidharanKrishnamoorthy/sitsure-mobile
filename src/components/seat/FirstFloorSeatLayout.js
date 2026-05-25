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
import { WorkstationSeatCell } from './WorkstationSeatCell';

// ─── Base dimensions (canvas width = 10 seats + gaps) ────────────────────────
const BASE_SEAT_W = 72;
const BASE_SEAT_H = 64;
const BASE_GAP_X = 8;
const BASE_GAP_Y = 10;
const BASE_SECTION_GAP = 36;
const BASE_AISLE_W = 64;
const BASE_ENTRANCE_AISLE_W = 80;

// ─── Seat colour logic ────────────────────────────────────────────────────────
function getSeatColor(seat, selectedSeatId, myBookedSeatId, userEmail) {
  const isMyBooked =
    seat.booking?.user_email === userEmail || seat.id === myBookedSeatId;
  const isSelected = seat.id === selectedSeatId;
  const isBooked = !!seat.booking;
  const isDisabled = !seat.enabled;

  if (isMyBooked)
    return {
      bg: COLORS.myBookingBg,
      border: COLORS.myBookingBorder,
      text: COLORS.myBookingText,
    };
  if (isSelected)
    return {
      bg: COLORS.seatSelectedBase,
      border: COLORS.seatSelectedAccent,
      text: COLORS.seatSelectedAccent,
    };
  if (isDisabled)
    return {
      bg: COLORS.seatDisabledBase,
      border: COLORS.seatDisabledAccent,
      text: COLORS.seatDisabledAccent,
    };
  if (isBooked)
    return {
      bg: COLORS.seatBookedBase,
      border: COLORS.seatBookedAccent,
      text: COLORS.seatBookedAccent,
    };
  return {
    bg: COLORS.seatAvailableBase,
    border: COLORS.seatAvailableAccent,
    text: COLORS.seatAvailableAccent,
  };
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
  style,
}) {
  if (!seat) return <View style={[{ width: seatW, height: seatH }, style]} />;

  const colors = getSeatColor(seat, selectedSeatId, myBookedSeatId, userEmail);
  const isMyBooked =
    seat.booking?.user_email === userEmail || seat.id === myBookedSeatId;
  const isOtherBooked = !!seat.booking && !isMyBooked;
  const isTouchDisabled = !seat.enabled;

  const handlePress = () => {
    if (!seat.enabled) return;
    if (isOtherBooked) {
      onBookedSeatPress && onBookedSeatPress(seat);
    } else {
      onSeatPress && onSeatPress(seat.id);
    }
  };

  return (
    <WorkstationSeatCell
      seat={seat}
      colors={colors}
      seatW={seatW}
      seatH={seatH}
      onPress={handlePress}
      disabled={isTouchDisabled}
      style={style}
    />
  );
}

// ─── Helper: render a horizontal row of seats ─────────────────────────────────
function SeatRow({ seatList, gap, seatW, seatH, selectedSeatId, myBookedSeatId, userEmail, onSeatPress, onBookedSeatPress }) {
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
          style={idx > 0 ? { marginLeft: gap } : undefined}
        />
      ))}
    </View>
  );
}

// ─── Helper: 4-seat bank (top row + bottom row back-to-back) ──────────────────
function SeatBank({ topRow, bottomRow, gap, seatW, seatH, selectedSeatId, myBookedSeatId, userEmail, onSeatPress, onBookedSeatPress }) {
  return (
    <View style={{ alignItems: 'flex-start' }}>
      <SeatRow
        seatList={topRow}
        gap={gap}
        seatW={seatW}
        seatH={seatH}
        selectedSeatId={selectedSeatId}
        myBookedSeatId={myBookedSeatId}
        userEmail={userEmail}
        onSeatPress={onSeatPress}
        onBookedSeatPress={onBookedSeatPress}
      />
      <View style={{ height: gap }} />
      <SeatRow
        seatList={bottomRow}
        gap={gap}
        seatW={seatW}
        seatH={seatH}
        selectedSeatId={selectedSeatId}
        myBookedSeatId={myBookedSeatId}
        userEmail={userEmail}
        onSeatPress={onSeatPress}
        onBookedSeatPress={onBookedSeatPress}
      />
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function FirstFloorSeatLayout({
  seats = [],
  selectedSeatId,
  onSeatPress,
  onBookedSeatPress,
  myBookedSeatId,
  userEmail,
}) {
  const screenWidth = Dimensions.get('window').width;
  // layout natural width = 10*72 + 9*8 = 792 — no scale cap, scroll handles overflow
  const scale = Math.max(0.55, Math.min(1, screenWidth / 420));

  const seatW = BASE_SEAT_W * scale;
  const seatH = BASE_SEAT_H * scale;
  const gapX = BASE_GAP_X * scale;
  const gapY = BASE_GAP_Y * scale;
  const sectionGap = BASE_SECTION_GAP * scale;
  const aisleW = BASE_AISLE_W * scale;
  const entranceAisleW = BASE_ENTRANCE_AISLE_W * scale;

  // ── Lounge seat dimensions: portrait / rotated ────────────────────────────
  const loungeW = seatH;           // narrow side
  const loungeH = seatW * 0.8;    // tall side

  // ── Seat slices ───────────────────────────────────────────────────────────
  const row1 = seats.slice(0, 10);

  const leftBankTop = seats.slice(10, 14);
  const leftBankBottom = seats.slice(14, 18);

  const rightBankTop = seats.slice(18, 22);
  const rightBankBottom = seats.slice(22, 26);

  const bottomLeft = seats.slice(26, 30);
  const bottomRight = seats.slice(30, 33);

  const loungeSeats = seats.slice(33, 37);
  // lounge: col-0 = seats 33,34  col-1 = seats 35,36
  const loungeCol0 = [loungeSeats[0], loungeSeats[1]];
  const loungeCol1 = [loungeSeats[2], loungeSeats[3]];

  // ── Shared seat props passthrough ─────────────────────────────────────────
  const seatProps = { selectedSeatId, myBookedSeatId, userEmail, onSeatPress, onBookedSeatPress, seatW, seatH };
  const rowProps = { ...seatProps, gap: gapX };

  return (
    <View style={styles.wrapper}>
      {/* ── Scrollable layout ── */}
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
          <View style={{ alignItems: 'flex-start' }}>

            {/* ── ROW 1 ── */}
            <SeatRow seatList={row1} {...rowProps} />

            <View style={{ height: sectionGap }} />

            {/* ── MIDDLE SECTION: Left bank + Right bank ── */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <SeatBank
                topRow={leftBankTop}
                bottomRow={leftBankBottom}
                gap={gapX}
                seatW={seatW}
                seatH={seatH}
                selectedSeatId={selectedSeatId}
                myBookedSeatId={myBookedSeatId}
                userEmail={userEmail}
                onSeatPress={onSeatPress}
                onBookedSeatPress={onBookedSeatPress}
              />

              {/* Central aisle */}
              <View style={{ width: aisleW }} />

              <SeatBank
                topRow={rightBankTop}
                bottomRow={rightBankBottom}
                gap={gapX}
                seatW={seatW}
                seatH={seatH}
                selectedSeatId={selectedSeatId}
                myBookedSeatId={myBookedSeatId}
                userEmail={userEmail}
                onSeatPress={onSeatPress}
                onBookedSeatPress={onBookedSeatPress}
              />
            </View>

            <View style={{ height: sectionGap }} />

            {/* ── BOTTOM SECTION ── */}
            {/* Left group under left bank, right group under right bank */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View>
                <SeatRow seatList={bottomLeft} {...rowProps} />
              </View>
              {/* gap = aisleW + rightBankWidth - bottomRightWidth to align right group under right bank */}
              <View style={{ width: aisleW }} />
              <View>
                <SeatRow seatList={bottomRight} {...rowProps} />
              </View>
            </View>

            <View style={{ height: sectionGap }} />

            {/* ── LOUNGE — offset to align under right bank ── */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              {/* spacer to push lounge under right bank */}
              <View style={{ width: (4 * seatW + 3 * gapX) + aisleW + entranceAisleW * 0.3 }} />
              {/* Column 0 — faces right */}
              <View style={{ flexDirection: 'column' }}>
                {loungeCol0.map((seat, idx) => (
                  <SeatCell
                    key={seat ? seat.id : `lounge-col0-${idx}`}
                    seat={seat}
                    selectedSeatId={selectedSeatId}
                    myBookedSeatId={myBookedSeatId}
                    userEmail={userEmail}
                    onSeatPress={onSeatPress}
                    onBookedSeatPress={onBookedSeatPress}
                    seatW={loungeW}
                    seatH={loungeH}
                    style={idx > 0 ? { marginTop: gapY } : undefined}
                  />
                ))}
              </View>

              {/* Gap between facing columns */}
              <View style={{ width: aisleW * 0.6 }} />

              {/* Column 1 — faces left */}
              <View style={{ flexDirection: 'column' }}>
                {loungeCol1.map((seat, idx) => (
                  <SeatCell
                    key={seat ? seat.id : `lounge-col1-${idx}`}
                    seat={seat}
                    selectedSeatId={selectedSeatId}
                    myBookedSeatId={myBookedSeatId}
                    userEmail={userEmail}
                    onSeatPress={onSeatPress}
                    onBookedSeatPress={onBookedSeatPress}
                    seatW={loungeW}
                    seatH={loungeH}
                    style={idx > 0 ? { marginTop: gapY } : undefined}
                  />
                ))}
              </View>
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
  sectionLabel: {
    fontSize: 11,
    color: '#9e9e9e',
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
