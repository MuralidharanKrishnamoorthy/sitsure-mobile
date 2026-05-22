import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS } from '../../theme/colors';

const SEAT_W = 60;
const SEAT_H = 36;
const GAP = 6;

function getSeatColor(seat, selectedSeatId, myBookedSeatId, userEmail) {
  const isMyBooked = seat.booking?.user_email === userEmail || seat.id === myBookedSeatId;
  const isSelected = seat.id === selectedSeatId;
  const isBooked = !!seat.booking;
  const isDisabled = !seat.enabled;

  if (isMyBooked) return { bg: COLORS.myBookingBg, border: COLORS.myBookingBorder, text: COLORS.myBookingText };
  if (isSelected) return { bg: COLORS.seatSelectedBase, border: COLORS.seatSelectedAccent, text: '#fff' };
  if (isDisabled) return { bg: COLORS.seatDisabledBase, border: COLORS.seatDisabledAccent, text: COLORS.seatDisabledAccent };
  if (isBooked) return { bg: COLORS.seatBookedBase, border: COLORS.seatBookedAccent, text: COLORS.seatBookedAccent };
  return { bg: COLORS.seatAvailableBase, border: COLORS.seatAvailableAccent, text: COLORS.seatAvailableAccent };
}

export default function FloorSeatLayout({ seats, selectedFloorId, selectedSeatId, myBookedSeatId, onSeatPress, onBookedSeatPress, userEmail }) {
  const floorSeats = seats.filter((s) => s.floor_id === selectedFloorId || s.floor?.id === selectedFloorId);

  if (floorSeats.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No seats available for this floor.</Text>
      </View>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator>
      <View style={styles.grid}>
        {floorSeats.map((seat) => {
          const colors = getSeatColor(seat, selectedSeatId, myBookedSeatId, userEmail);
          const isMyBooked = seat.booking?.user_email === userEmail || seat.id === myBookedSeatId;
          const isOtherBooked = !!seat.booking && !isMyBooked;
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
              key={seat.id}
              style={[styles.seat, { backgroundColor: colors.bg, borderColor: colors.border }]}
              onPress={handlePress}
              disabled={!seat.enabled}
            >
              <Text style={[styles.seatLabel, { color: colors.text }]}>{seat.label}</Text>
              {seat.has_monitor && <View style={styles.monitorDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', padding: 8, gap: GAP,
  },
  seat: {
    width: SEAT_W, height: SEAT_H, borderRadius: 6, borderWidth: 2,
    justifyContent: 'center', alignItems: 'center', margin: GAP / 2,
  },
  seatLabel: { fontSize: 11, fontWeight: '700' },
  monitorDot: {
    position: 'absolute', top: 3, right: 3,
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: COLORS.monitorBadge,
  },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { color: '#999', fontSize: 14 },
});
