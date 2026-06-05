import React, {useState, useEffect, useContext} from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, Alert, Image,
} from 'react-native';
import Animated, {FadeInDown} from 'react-native-reanimated';
import {useTheme} from '../../context/ThemeContext';
import {UserContext} from '../../context/UserContext';
import {getEmployeeGroups, upsertEmployeeGroup} from '../../services/employeeGroupService';
import {getGraphUserProfile} from '../../services/graphService';
import {COLORS} from '../../theme/colors';
import Loader from '../../components/Loader';

const GROUP_OPTIONS = ['SDOS', 'SDL', 'QA', 'VENZO'];
const GROUP_COLORS = COLORS.groupColors;

function normalizeGroups(groups) {
  return [...new Set(groups.map(g => g.trim().toUpperCase()).filter(Boolean))];
}

function getPrimaryPalette(groups) {
  for (const g of groups) {
    if (GROUP_COLORS[g.toUpperCase()]) return GROUP_COLORS[g.toUpperCase()];
  }
  return {bg: COLORS.primaryMuted, text: COLORS.primary};
}

function GroupChip({group}) {
  const cfg = GROUP_COLORS[group.toUpperCase()] || {bg: COLORS.primaryMuted, text: COLORS.primary};
  return (
    <View style={[chipStyles.wrap, {backgroundColor: cfg.bg}]}>
      <Text style={[chipStyles.text, {color: cfg.text}]}>{group}</Text>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  wrap: {borderRadius: 8, paddingVertical: 3, paddingHorizontal: 9},
  text: {fontSize: 11, fontWeight: '700'},
});

export default function EmployeeGroupsScreen() {
  const {accessToken} = useContext(UserContext);
  const {t} = useTheme();
  const [groups, setGroups] = useState([]);
  const [photos, setPhotos] = useState({});
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [selectedGroups, setSelectedGroups] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getEmployeeGroups();
      setGroups(data);
      if (accessToken) {
        const photoMap = {};
        await Promise.all(
          data.map(async entry => {
            const profile = await getGraphUserProfile(entry.email, accessToken);
            if (profile?.photoUrl) photoMap[entry.email] = profile.photoUrl;
          }),
        );
        setPhotos(photoMap);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load employee groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleGroup = g => {
    setSelectedGroups(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  };

  const handleAdd = async () => {
    if (!email.trim() || selectedGroups.length === 0) {
      Alert.alert('Validation', 'Email and at least one group required');
      return;
    }
    if (!email.includes('@')) {
      Alert.alert('Validation', 'Enter a valid email address');
      return;
    }
    try {
      await upsertEmployeeGroup({email: email.trim().toLowerCase(), groups: normalizeGroups(selectedGroups)});
      setEmail('');
      setSelectedGroups([]);
      await load();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to assign groups');
    }
  };

  const renderCard = ({item, index}) => {
    const palette = getPrimaryPalette(item.groups || []);
    const photoUrl = photos[item.email];
    const initial = item.email[0].toUpperCase();

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 35).duration(350)}
        style={[styles.card, {backgroundColor: t.card, borderColor: t.cardBorder}]}>
        {/* Left accent stripe using group color */}
        <View style={[styles.cardAccent, {backgroundColor: palette.text}]} />
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            {photoUrl ? (
              <Image source={{uri: photoUrl}} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarFallback, {backgroundColor: `${palette.text}20`}]}>
                <Text style={[styles.avatarInitial, {color: palette.text}]}>{initial}</Text>
              </View>
            )}
            <View style={styles.cardInfo}>
              <Text style={[styles.cardEmail, {color: t.text}]} numberOfLines={1}>{item.email}</Text>
              <View style={[styles.bookingBadge, {backgroundColor: t.chipBg}]}>
                <Text style={[styles.cardCount, {color: t.textSub}]}>{item.bookingCount ?? 0} bookings</Text>
              </View>
            </View>
          </View>
          <View style={styles.groupsRow}>
            {(item.groups || []).map(g => <GroupChip key={g} group={g} />)}
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, {backgroundColor: t.bg}]}>

      {/* Add form */}
      <View style={[styles.addCard, {backgroundColor: t.card, borderColor: t.cardBorder}]}>
        <Text style={[styles.addTitle, {color: t.text}]}>Assign Employee Group</Text>
        <TextInput
          style={[styles.input, {backgroundColor: t.inputBg, borderColor: t.inputBorder, color: t.text}]}
          placeholder="user@venzotechnologies.com"
          placeholderTextColor={t.textTertiary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <View style={styles.groupPicker}>
          {GROUP_OPTIONS.map(g => (
            <TouchableOpacity
              key={g}
              style={[
                styles.groupOption,
                {borderColor: t.chipBorder},
                selectedGroups.includes(g) && {backgroundColor: COLORS.primary, borderColor: COLORS.primary},
              ]}
              onPress={() => toggleGroup(g)}>
              <Text style={[
                styles.groupOptionText,
                {color: t.textSub},
                selectedGroups.includes(g) && {color: '#fff'},
              ]}>
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={[styles.addBtn, {backgroundColor: COLORS.primary}]}
          onPress={handleAdd}>
          <Text style={styles.addBtnText}>Save Assignment</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderWrap}>
          <Loader color={COLORS.primary} size={28} />
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={item => item.email}
          renderItem={renderCard}
          ItemSeparatorComponent={() => <View style={{height: 10}} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 16},
  loaderWrap: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  listContent: {paddingBottom: 32},

  addCard: {
    borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1,
    shadowColor: '#000', shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  addTitle: {fontWeight: '800', fontSize: 15, marginBottom: 12, letterSpacing: -0.2},
  input: {
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, marginBottom: 12,
  },
  groupPicker: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12},
  groupOption: {
    borderWidth: 1.5, borderRadius: 22,
    paddingVertical: 8, paddingHorizontal: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  groupOptionText: {fontWeight: '700', fontSize: 13},
  addBtn: {
    borderRadius: 12, padding: 13, alignItems: 'center',
    shadowColor: COLORS.primary, shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 5,
  },
  addBtnText: {color: '#fff', fontWeight: '700', fontSize: 14},

  card: {
    borderRadius: 14, borderWidth: 1,
    flexDirection: 'row', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardAccent: {width: 4},
  cardBody: {flex: 1, padding: 14},
  cardHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 12},
  avatar: {width: 42, height: 42, borderRadius: 21, flexShrink: 0},
  avatarFallback: {
    width: 42, height: 42, borderRadius: 21, flexShrink: 0,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: {fontWeight: '800', fontSize: 16},
  cardInfo: {flex: 1, minWidth: 0},
  cardEmail: {fontWeight: '600', fontSize: 13, marginBottom: 4},
  bookingBadge: {alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2},
  cardCount: {fontSize: 11, fontWeight: '600'},
  groupsRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 6},
});
