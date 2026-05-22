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

const BASE_SEAT_W = 72;
const BASE_SEAT_H = 44;
const BASE_GAP_X = 8;
const BASE_SECTION_GAP_Y = 48;

const TOP_COUNT = 5;
const CENTER_COUNT = 2;
const BOTTOM_COUNT = 5;

function getSeatColor(seat, selectedSeatId, myBookedSeatId, userEmail) {
  const isMyBooked =
    seat.booking?.user_email === userEmail || seat.id === myBookedSeatId;
  const isSelected = seat.id === selectedSeatId;
  const isBooked = !!seat.booking;
  const isDisabled = !seat.enabled;

  if (isMyBooked) return { bg: COLORS.myBookingBg, border: COLORS.myBookingBorder, text: COLORS.myBookingText };
  if (isSelected) return { bg: COLORS.seatSelectedBase, border: COLORS.seatSelectedAccent, text: '#fff' };
  if (isDisabled) return { bg: COLORS.seatDisabledBase, border: COLORS.seatDisabledAccent, text: COLORS.seatDisabledAccent };
  if (isBooked) return { bg: COLORS.seatBookedBase, border: COLORS.seatBookedAccent, text: COLORS.seatBookedAccent };
  return { bg: COLORS.seatAvailableBase, border: COLORS.seatAvailableAccent, text: COLORS.seatAvailableAccent };
}

function SeatCell({ seat, selectedSeatId, myBookedSeatId, userEmail, onSeatPress, onBookedSeatPress, seatW, seatH, style }) {
  if (!seat) return <View style={[{ width: seatW, height: seatH }, style]} />;

  const colors = getSeatColor(seat, selectedSeatId, myBookedSeatId, userEmail);
  const isMyBooked = seat.booking?.user_email === userEmail || seat.id === myBookedSeatId;
  const isOtherBooked = !!seat.booking && !isMyBooked;
  const isTouchDisabled = !seat.enabled;
  const label = seat.floor?.name ? `${seat.floor.name}-${seat.label}` : seat.label;

  const handlePress = () => {
    if (!seat.enabled) return;
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
      <Text style={{ fontSize: Math.max(10, seatH * 0.30), fontWeight: '700', color: colors.text }} numberOfLines={1}>
        {label}
      </Text>
      {seat.has_monitor && (
        <View style={{ position: 'absolute', top: 3, right: 3, width: 7, height: 7, borderRadius: 3.5, backgroundColor: COLORS.monitorBadge }} />
      )}
    </TouchableOpacity>
  );
}

// Rotated seat: renders seatW x seatH but visually rotated 90deg
// We swap width/height so the touch target matches the rotated visual
function RotatedSeatCell({ seat, selectedSeatId, myBookedSeatId, userEmail, onSeatPress, onBookedSeatPress, seatW, seatH, style }) {
  if (!seat) return <View style={[{ width: seatH, height: seatW }, style]} />;

  const colors = getSeatColor(seat, selectedSeatId, myBookedSeatId, userEmail);
  const isMyBooked = seat.booking?.user_email === userEmail || seat.id === myBookedSeatId;
  const isOtherBooked = !!seat.booking && !isMyBooked;
  const isTouchDisabled = !seat.enabled;
  const label = seat.floor?.name ? `${seat.floor.name}-${seat.label}` : seat.label;

  const handlePress = () => {
    if (!seat.enabled) return;
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
          width: seatH,
          height: seatW,
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
      <View style={{ transform: [{ rotate: '90deg' }] }}>
        <Text style={{ fontSize: Math.max(9, seatH * 0.28), fontWeight: '700', color: colors.text }} numberOfLines={1}>
          {label}
        </Text>
      </View>
      {seat.has_monitor && (
        <View style={{ position: 'absolute', top: 3, right: 3, width: 7, height: 7, borderRadius: 3.5, backgroundColor: COLORS.monitorBadge }} />
      )}
    </TouchableOpacity>
  );
}

export default function ThirdFloorSeatLayout({
  seats = [],
  selectedSeatId,
  onSeatPress,
  onBookedSeatPress,
  myBookedSeatId,
  userEmail,
}) {
  const screenWidth = Dimensions.get('window').width;
  const scale = Math.max(0.55, Math.min(1, screenWidth / 420));

  const seatW = BASE_SEAT_W * scale;
  const seatH = BASE_SEAT_H * scale;
  const gapX = BASE_GAP_X * scale;
  const sectionGapY = BASE_SECTION_GAP_Y * scale;
  const centerGapY = 6 * scale;

  // Slices matching web: TOP_COUNT=5, CENTER_COUNT=2, BOTTOM_COUNT=5
  const cappedSeats = seats.slice(0, TOP_COUNT + CENTER_COUNT + BOTTOM_COUNT);
  const topRow = cappedSeats.slice(0, TOP_COUNT);            // seats 0–4: 3-1..3-5
  const centerSeats = cappedSeats.slice(TOP_COUNT, TOP_COUNT + CENTER_COUNT); // seats 5–6: 3-6, 3-7
  const bottomRowRaw = cappedSeats.slice(TOP_COUNT + CENTER_COUNT);            // seats 7–11: 3-8..3-12

  // Bottom row is reversed in display (3-12, 3-11, 3-10, 3-9, 3-8)
  const bottomRow = [...bottomRowRaw].reverse();

  // Top row width
  const topRowWidth = TOP_COUNT * seatW + (TOP_COUNT - 1) * gapX;

  // Center seats align to right edge of top row (under seat 3-5)
  // seat5 starts at index 4 from left: x = 4*(seatW+gapX)
  // web: centerColX = seat5StartX + seatW*0.25
  // In RN we just right-align the column under the 5th seat
  const seat5LeftOffset = 4 * (seatW + gapX);
  const centerColLeftOffset = seat5LeftOffset + seatW * 0.25;

  const seatProps = { selectedSeatId, myBookedSeatId, userEmail, onSeatPress, onBookedSeatPress, seatW, seatH };

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
          <View style={{ alignItems: 'flex-start' }}>

            {/* TOP ROW: 3-1 ... 3-5 (left to right) */}
            <View style={{ flexDirection: 'row' }}>
              {topRow.map((seat, idx) => (
                <SeatCell
                  key={seat ? seat.id : `top-${idx}`}
                  seat={seat}
                  {...seatProps}
                  style={idx > 0 ? { marginLeft: gapX } : undefined}
                />
              ))}
            </View>

            <View style={{ height: sectionGapY * 0.35 }} />

            {/* CENTER COLUMN: 3-6, 3-7 — rotated, right-aligned under seat 3-5 */}
            <View style={{ flexDirection: 'row' }}>
              {/* spacer to align under right edge area */}
              <View style={{ width: centerColLeftOffset }} />
              <View style={{ flexDirection: 'column' }}>
                {centerSeats.map((seat, idx) => (
                  <RotatedSeatCell
                    key={seat ? seat.id : `center-${idx}`}
                    seat={seat}
                    {...seatProps}
                    style={idx > 0 ? { marginTop: centerGapY } : undefined}
                  />
                ))}
              </View>
            </View>

            <View style={{ height: sectionGapY * 0.35 }} />

            {/* BOTTOM ROW: 3-12 ... 3-8 (reversed, facing north) */}
            <View style={{ flexDirection: 'row' }}>
              {bottomRow.map((seat, idx) => (
                <SeatCell
                  key={seat ? seat.id : `bottom-${idx}`}
                  seat={seat}
                  {...seatProps}
                  style={idx > 0 ? { marginLeft: gapX } : undefined}
                />
              ))}
            </View>

          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: COLORS.bgLight,
  },
});
