import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_W } = Dimensions.get('window');
import { UserContext } from '../context/UserContext';
import { getBookingAggregates } from '../services/bookingService';
import { getGraphUserProfile } from '../services/graphService';
import { formatDate } from '../utils/dateUtils';
import { COLORS } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import Loader from '../components/Loader';

const CHART_COLORS = COLORS.chartColors;

export default function FunsightsScreen() {
  const { accessToken } = useContext(UserContext);
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  // Stack columns on very small screens
  const useColumns = SCREEN_W >= 360;
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

  if (loading) return <Loader color={COLORS.primary} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} />;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: t.bg }]}
      contentContainerStyle={[styles.content, { paddingTop: Math.max(16, insets.top + 8) }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: t.text }]}>Fun Insights</Text>

      {/* Seat Heroes */}
      <Text style={[styles.section, { color: t.text }]}>Top 5 Seat Heroes</Text>
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
            <Text style={[styles.heroName, { color: t.text }]}>{hero.profile?.displayName || hero.email}</Text>
            <Text style={[styles.heroEmail, { color: t.textSub }]}>{hero.email}</Text>
            <View style={[styles.progressBarBg, { backgroundColor: t.divider }]}>
              <View
                style={[styles.progressBarFill, {
                  width: `${(hero.count / maxHeroCount) * 100}%`,
                  backgroundColor: CHART_COLORS[index],
                }]}
              />
            </View>
          </View>
          <Text style={[styles.heroCount, { color: t.text }]}>{hero.count}</Text>
        </View>
      ))}

      <View style={[styles.twoCol, !useColumns && styles.twoColStack]}>
        {/* Popular Days */}
        <View style={[styles.colCard, { backgroundColor: t.card }, !useColumns && styles.colCardFull]}>
          <Text style={[styles.section, { color: t.text }]}>Popular Days</Text>
          {popularDays.map(({ date, count }) => (
            <View key={date} style={[styles.popularDayRow, { backgroundColor: t.chipBg }]}>
              <Text style={[styles.popularDayDate, { color: t.text }]}>{formatDate(date)}</Text>
              <Text style={[styles.popularDayCount, { color: t.textSub }]}>{count} bookings</Text>
            </View>
          ))}
        </View>

        {/* Favourite Seats */}
        <View style={[styles.colCard, { backgroundColor: t.card }, !useColumns && styles.colCardFull]}>
          <Text style={[styles.section, { color: t.text }]}>Favourite Seats</Text>
          {favSeats.map(({ seat, count }, index) => (
            <View key={seat.id} style={styles.favSeatRow}>
              <Text style={[styles.favSeatLabel, { color: t.text }]}>
                {seat.floor?.name ? `${seat.floor.name}-${seat.label}` : seat.label}
              </Text>
              <View style={[styles.progressBarBg, { backgroundColor: t.divider }]}>
                <View
                  style={[styles.progressBarFill, {
                    width: `${(count / maxSeatCount) * 100}%`,
                    backgroundColor: CHART_COLORS[(index + 2) % CHART_COLORS.length],
                  }]}
                />
              </View>
              <Text style={[styles.favSeatCount, { color: t.textSub }]}>{count} bookings</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.primary, marginBottom: 16, letterSpacing: -0.5 },
  section: { fontSize: 15, fontWeight: '700', marginBottom: 10, marginTop: 4, letterSpacing: -0.2 },
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
  twoCol: { flexDirection: 'row', gap: 10 },
  twoColStack: { flexDirection: 'column' },
  colCard: { flex: 1, borderRadius: 12, padding: 14 },
  colCardFull: { flex: 0, width: '100%' },
  popularDayRow: {
    backgroundColor: 'rgba(25,118,210,0.08)', borderRadius: 6, padding: 9, marginBottom: 6,
  },
  popularDayDate: { fontSize: 13, fontWeight: '600', color: '#212121' },
  popularDayCount: { fontSize: 12, color: '#555' },
  favSeatRow: { marginBottom: 10 },
  favSeatLabel: { fontWeight: '600', fontSize: 13, marginBottom: 4, color: '#212121' },
  favSeatCount: { fontSize: 12, color: '#555', marginTop: 2 },
});
