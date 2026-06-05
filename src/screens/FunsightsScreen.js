import React, {useState, useEffect, useContext} from 'react';
import {View, Text, StyleSheet, ScrollView, Image, Dimensions} from 'react-native';
import Animated, {
  FadeInDown, useSharedValue, useAnimatedStyle, withTiming, Easing,
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const {width: SCREEN_W} = Dimensions.get('window');
import {UserContext} from '../context/UserContext';
import {getBookingAggregates} from '../services/bookingService';
import {getGraphUserProfile} from '../services/graphService';
import {formatDate} from '../utils/dateUtils';
import {COLORS} from '../theme/colors';
import {useTheme} from '../context/ThemeContext';
import Loader from '../components/Loader';

const CHART_COLORS = COLORS.chartColors;

// ── Animated progress bar ─────────────────────────────────────────────────────

function ProgressBar({pct, color, delay = 0}) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(pct, {duration: 700 + delay, easing: Easing.out(Easing.cubic)});
  }, [pct]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View style={pbStyles.track}>
      <Animated.View style={[pbStyles.fill, {backgroundColor: color}, barStyle]} />
    </View>
  );
}

const pbStyles = StyleSheet.create({
  track: {height: 7, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 4, overflow: 'hidden', flex: 1},
  fill: {height: 7, borderRadius: 4},
});

// ── Rank badge ────────────────────────────────────────────────────────────────

function RankBadge({rank}) {
  const colors = ['#FFD700', '#C0C0C0', '#CD7F32', COLORS.primaryMuted, COLORS.primaryMuted];
  const textColors = ['#7A5900', '#555', '#7A3B00', COLORS.primary, COLORS.primary];
  return (
    <View style={[rankStyles.badge, {backgroundColor: colors[rank] || COLORS.primaryMuted}]}>
      <Text style={[rankStyles.text, {color: textColors[rank] || COLORS.primary}]}>{rank + 1}</Text>
    </View>
  );
}

const rankStyles = StyleSheet.create({
  badge: {width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 10, flexShrink: 0},
  text: {fontWeight: '900', fontSize: 12},
});

export default function FunsightsScreen() {
  const {accessToken} = useContext(UserContext);
  const {t} = useTheme();
  const insets = useSafeAreaInsets();
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

        const byUser = {};
        all.forEach(b => {
          if (!b.user_email) return;
          byUser[b.user_email] = (byUser[b.user_email] || 0) + 1;
        });
        const sortedUsers = Object.entries(byUser).sort((a, b) => b[1] - a[1]).slice(0, 5);

        const heroData = await Promise.all(
          sortedUsers.map(async ([email, count]) => {
            const profile = accessToken ? await getGraphUserProfile(email, accessToken) : null;
            return {email, count, profile};
          }),
        );
        setHeroes(heroData);

        const byDate = {};
        all.forEach(b => {
          if (!b.date) return;
          byDate[b.date] = (byDate[b.date] || 0) + 1;
        });
        const sortedDates = Object.entries(byDate).sort((a, b) => b[1] - a[1]).slice(0, 5);
        setPopularDays(sortedDates.map(([date, count]) => ({date, count})));

        const bySeat = {};
        all.forEach(b => {
          if (!b.seat?.id) return;
          const key = b.seat.id;
          if (!bySeat[key]) bySeat[key] = {seat: b.seat, count: 0};
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

  if (loading) {
    return (
      <View style={[styles.loadWrap, {backgroundColor: t.bg}]}>
        <Loader color={COLORS.primary} size={28} style={{flex: 1, justifyContent: 'center', alignItems: 'center'}} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, {backgroundColor: t.bg}]}
      contentContainerStyle={[styles.content, {paddingTop: Math.max(16, insets.top + 8)}]}
      showsVerticalScrollIndicator={false}>

      {/* Header */}
      <Animated.View entering={FadeInDown.duration(350)} style={styles.headerBlock}>
        <Text style={[styles.title, {color: t.text}]}>Fun Insights</Text>
        <Text style={[styles.subtitle, {color: t.textSub}]}>Office activity at a glance</Text>
      </Animated.View>

      {/* Seat Heroes */}
      <Animated.View entering={FadeInDown.delay(60).duration(400)}>
        <Text style={[styles.section, {color: t.text}]}>Seat Heroes</Text>
        <View style={[styles.sectionCard, {backgroundColor: t.card}]}>
          {heroes.map((hero, index) => (
            <View key={hero.email} style={[
              styles.heroRow,
              {borderBottomColor: t.divider},
              index < heroes.length - 1 && {borderBottomWidth: 1},
            ]}>
              <RankBadge rank={index} />
              <View style={styles.heroAvatar}>
                {hero.profile?.photoUrl ? (
                  <Image source={{uri: hero.profile.photoUrl}} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatarFallback, {backgroundColor: `${CHART_COLORS[index]}25`}]}>
                    <Text style={[styles.avatarInitial, {color: CHART_COLORS[index]}]}>
                      {(hero.profile?.displayName || hero.email)[0].toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.heroInfo}>
                <Text style={[styles.heroName, {color: t.text}]} numberOfLines={1}>
                  {hero.profile?.displayName || hero.email}
                </Text>
                <ProgressBar pct={(hero.count / maxHeroCount) * 100} color={CHART_COLORS[index]} delay={index * 80} />
              </View>
              <Text style={[styles.heroCount, {color: CHART_COLORS[index]}]}>{hero.count}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* Two column section */}
      <Animated.View
        entering={FadeInDown.delay(140).duration(400)}
        style={[styles.twoCol, !useColumns && styles.twoColStack]}>

        {/* Popular Days */}
        <View style={[styles.colCard, {backgroundColor: t.card}, !useColumns && styles.colCardFull]}>
          <Text style={[styles.colTitle, {color: t.text}]}>Popular Days</Text>
          {popularDays.map(({date, count}, i) => (
            <View key={date} style={[styles.popularDayRow, {backgroundColor: t.chipBg}]}>
              <Text style={[styles.popularDayDate, {color: t.text}]}>{formatDate(date)}</Text>
              <View style={[styles.popularDayBadge, {backgroundColor: COLORS.primaryMuted}]}>
                <Text style={[styles.popularDayCount, {color: COLORS.primary}]}>{count}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Favourite Seats */}
        <View style={[styles.colCard, {backgroundColor: t.card}, !useColumns && styles.colCardFull]}>
          <Text style={[styles.colTitle, {color: t.text}]}>Top Seats</Text>
          {favSeats.map(({seat, count}, index) => (
            <View key={seat.id} style={styles.favSeatRow}>
              <View style={styles.favSeatTop}>
                <Text style={[styles.favSeatLabel, {color: t.text}]}>
                  {seat.floor?.name ? `${seat.floor.name}-${seat.label}` : seat.label}
                </Text>
                <Text style={[styles.favSeatCount, {color: t.textTertiary}]}>{count}×</Text>
              </View>
              <ProgressBar
                pct={(count / maxSeatCount) * 100}
                color={CHART_COLORS[(index + 2) % CHART_COLORS.length]}
                delay={index * 60}
              />
            </View>
          ))}
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  content: {padding: 16, paddingBottom: 40},
  loadWrap: {flex: 1, alignItems: 'center', justifyContent: 'center'},

  headerBlock: {marginBottom: 22},
  title: {fontSize: 28, fontWeight: '900', letterSpacing: -0.8},
  subtitle: {fontSize: 13, fontWeight: '500', marginTop: 4},

  section: {fontSize: 13, fontWeight: '700', marginBottom: 10, letterSpacing: 0.6, textTransform: 'uppercase'},

  sectionCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    gap: 0,
  },
  heroAvatar: {marginRight: 10},
  avatar: {width: 38, height: 38, borderRadius: 19},
  avatarFallback: {width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center'},
  avatarInitial: {fontWeight: '800', fontSize: 15},
  heroInfo: {flex: 1, gap: 6},
  heroName: {fontWeight: '600', fontSize: 13},
  heroCount: {fontWeight: '900', fontSize: 16, marginLeft: 10, minWidth: 28, textAlign: 'right'},

  twoCol: {flexDirection: 'row', gap: 12},
  twoColStack: {flexDirection: 'column'},
  colCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  colCardFull: {flex: 0, width: '100%'},
  colTitle: {fontSize: 13, fontWeight: '700', letterSpacing: 0.4, marginBottom: 4, textTransform: 'uppercase'},

  popularDayRow: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  popularDayDate: {fontSize: 12, fontWeight: '600'},
  popularDayBadge: {borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2},
  popularDayCount: {fontSize: 11, fontWeight: '800'},

  favSeatRow: {gap: 5},
  favSeatTop: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  favSeatLabel: {fontWeight: '600', fontSize: 12},
  favSeatCount: {fontSize: 11, fontWeight: '600'},
});
