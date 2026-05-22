import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, Image,
} from 'react-native';
import { UserContext } from '../context/UserContext';
import { getBookingAggregates } from '../services/bookingService';
import { getGraphUserProfile } from '../services/graphService';
import { formatDate } from '../utils/dateUtils';
import { COLORS } from '../theme/colors';

const CHART_COLORS = COLORS.chartColors;

export default function FunsightsScreen() {
  const { accessToken } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const [heroes, setHeroes] = useState([]);
  const [popularDays, setPopularDays] = useState([]);
  const [favSeats, setFavSeats] = useState([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const all = await getBookingAggregates();

        // Top 5 seat heroes
        const byUser = {};
        all.forEach((b) => {
          if (!b.user_email) return;
          byUser[b.user_email] = (byUser[b.user_email] || 0) + 1;
        });
        const sortedUsers = Object.entries(byUser).sort((a, b) => b[1] - a[1]).slice(0, 5);

        const heroData = await Promise.all(
          sortedUsers.map(async ([email, count]) => {
            const profile = accessToken ? await getGraphUserProfile(email, accessToken) : null;
            return { email, count, profile };
          })
        );
        setHeroes(heroData);

        // Top 5 popular days
        const byDate = {};
        all.forEach((b) => {
          if (!b.date) return;
          byDate[b.date] = (byDate[b.date] || 0) + 1;
        });
        const sortedDates = Object.entries(byDate).sort((a, b) => b[1] - a[1]).slice(0, 5);
        setPopularDays(sortedDates.map(([date, count]) => ({ date, count })));

        // Top 5 favourite seats
        const bySeat = {};
        all.forEach((b) => {
          if (!b.seat?.id) return;
          const key = b.seat.id;
          if (!bySeat[key]) bySeat[key] = { seat: b.seat, count: 0 };
          bySeat[key].count += 1;
        });
        const sortedSeats = Object.values(bySeat).sort((a, b) => b.count - a.count).slice(0, 5);
        setFavSeats(sortedSeats);
      } catch (err) {
        console.error('Funsights load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [accessToken]);

  const maxHeroCount = heroes[0]?.count || 1;
  const maxSeatCount = favSeats[0]?.count || 1;

  if (loading) return <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Fun Insights</Text>

      {/* Seat Heroes */}
      <Text style={styles.section}>Top 5 Seat Heroes</Text>
      {heroes.map((hero, index) => (
        <View key={hero.email} style={[styles.heroRow, { backgroundColor: `${CHART_COLORS[index]}20` }]}>
          <View style={styles.heroAvatar}>
            {hero.profile?.photoUrl ? (
              <Image source={{ uri: hero.profile.photoUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: CHART_COLORS[index] }]}>
                <Text style={styles.avatarInitial}>
                  {(hero.profile?.displayName || hero.email)[0].toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.heroName}>{hero.profile?.displayName || hero.email}</Text>
            <Text style={styles.heroEmail}>{hero.email}</Text>
            <View style={styles.progressBarBg}>
              <View
                style={[styles.progressBarFill, {
                  width: `${(hero.count / maxHeroCount) * 100}%`,
                  backgroundColor: CHART_COLORS[index],
                }]}
              />
            </View>
          </View>
          <Text style={styles.heroCount}>{hero.count}</Text>
        </View>
      ))}

      <View style={styles.twoCol}>
        {/* Popular Days */}
        <View style={styles.colCard}>
          <Text style={styles.section}>Popular Days</Text>
          {popularDays.map(({ date, count }) => (
            <View key={date} style={styles.popularDayRow}>
              <Text style={styles.popularDayDate}>{formatDate(date)}</Text>
              <Text style={styles.popularDayCount}>{count} bookings</Text>
            </View>
          ))}
        </View>

        {/* Favourite Seats */}
        <View style={styles.colCard}>
          <Text style={styles.section}>Favourite Seats</Text>
          {favSeats.map(({ seat, count }, index) => (
            <View key={seat.id} style={styles.favSeatRow}>
              <Text style={styles.favSeatLabel}>
                {seat.floor?.name ? `${seat.floor.name}-${seat.label}` : seat.label}
              </Text>
              <View style={styles.progressBarBg}>
                <View
                  style={[styles.progressBarFill, {
                    width: `${(count / maxSeatCount) * 100}%`,
                    backgroundColor: CHART_COLORS[(index + 2) % CHART_COLORS.length],
                  }]}
                />
              </View>
              <Text style={styles.favSeatCount}>{count} bookings</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgLight },
  content: { padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.primary, marginBottom: 16 },
  section: { fontSize: 17, fontWeight: '700', color: '#212121', marginBottom: 8, marginTop: 8 },
  heroRow: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 8,
    padding: 10, marginBottom: 8,
  },
  heroAvatar: { marginRight: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarFallback: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: '#fff', fontWeight: '700', fontSize: 18 },
  heroInfo: { flex: 1 },
  heroName: { fontWeight: '600', fontSize: 14, color: '#212121' },
  heroEmail: { fontSize: 12, color: '#555', marginBottom: 4 },
  heroCount: { fontWeight: '700', fontSize: 17, marginLeft: 8, color: '#212121' },
  progressBarBg: { height: 7, backgroundColor: '#e0e0e0', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: 7, borderRadius: 4 },
  twoCol: { flexDirection: 'row', gap: 8 },
  colCard: { flex: 1, backgroundColor: '#fff', borderRadius: 8, padding: 12 },
  popularDayRow: {
    backgroundColor: 'rgba(25,118,210,0.08)', borderRadius: 6, padding: 9, marginBottom: 6,
  },
  popularDayDate: { fontSize: 13, fontWeight: '600', color: '#212121' },
  popularDayCount: { fontSize: 12, color: '#555' },
  favSeatRow: { marginBottom: 10 },
  favSeatLabel: { fontWeight: '600', fontSize: 13, marginBottom: 4, color: '#212121' },
  favSeatCount: { fontSize: 12, color: '#555', marginTop: 2 },
});
