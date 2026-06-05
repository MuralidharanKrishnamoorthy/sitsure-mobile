import React, {createContext, useState, useCallback, useEffect, useContext} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {COLORS} from '../theme/colors';

export const ThemeContext = createContext({darkMode: false, toggleTheme: () => {}, t: {}});

// ── Lumina light theme — warm cream + electric violet ─────────────────────────
const light = {
  dark: false,
  bg: COLORS.bgLight,              // #FAFAF8 warm cream
  card: COLORS.paperLight,         // #FFFFFF
  cardBorder: '#EBEBF0',
  cardShadow: 'rgba(15,15,26,0.06)',
  text: COLORS.textPrimaryLight,   // #0F0F1A
  textSub: COLORS.textSecondaryLight,
  textTertiary: COLORS.textTertiaryLight,
  tabBar: '#FFFFFF',
  tabBarBorder: '#EBEBF0',
  tabInactive: COLORS.textTertiaryLight,
  drawerBg: '#FFFFFF',
  drawerActiveText: COLORS.primary,
  drawerActiveBg: COLORS.primaryMuted,
  inputBg: '#FFFFFF',
  inputBorder: '#DDDDE8',
  divider: '#F0F0F5',
  shimmer: '#F4F4F8',
  sectionLabel: COLORS.textSecondaryLight,
  chipBorder: '#DDDDE8',
  chipBg: '#F4F4F8',
  // extra Lumina tokens
  headerBg: COLORS.primary,
  headerText: '#FFFFFF',
  surface: '#F4F4F8',              // nested surface / input bg variant
  badgeBg: COLORS.primaryMuted,
  badgeText: COLORS.primary,
};

// ── Lumina dark theme — midnight indigo depths ────────────────────────────────
const dark = {
  dark: true,
  bg: COLORS.bgDark,              // #0C0C10 midnight
  card: COLORS.paperDark,         // #16161F
  cardBorder: 'rgba(255,255,255,0.06)',
  cardShadow: 'rgba(0,0,0,0.55)',
  text: COLORS.textPrimaryDark,   // #F0EFFF
  textSub: COLORS.textSecondaryDark,
  textTertiary: COLORS.textTertiaryDark,
  tabBar: '#111119',
  tabBarBorder: 'rgba(255,255,255,0.06)',
  tabInactive: COLORS.textTertiaryDark,
  drawerBg: '#111119',
  drawerActiveText: COLORS.primaryLight,
  drawerActiveBg: 'rgba(139,111,255,0.12)',
  inputBg: COLORS.paperDark,
  inputBorder: 'rgba(255,255,255,0.08)',
  divider: 'rgba(255,255,255,0.06)',
  shimmer: COLORS.canvasDark,
  sectionLabel: COLORS.textSecondaryDark,
  chipBorder: 'rgba(255,255,255,0.10)',
  chipBg: 'rgba(255,255,255,0.04)',
  // extra Lumina tokens
  headerBg: '#111119',
  headerText: COLORS.textPrimaryDark,
  surface: COLORS.canvasDark,
  badgeBg: 'rgba(139,111,255,0.15)',
  badgeText: COLORS.primaryLight,
};

export const THEME = {light, dark};

export function ThemeProvider({children}) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('sitsure_dark_mode')
      .then(v => {
        if (v === 'true') setDarkMode(true);
      })
      .catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setDarkMode(d => {
      const next = !d;
      AsyncStorage.setItem('sitsure_dark_mode', String(next));
      return next;
    });
  }, []);

  const t = darkMode ? dark : light;

  return (
    <ThemeContext.Provider value={{darkMode, toggleTheme, t}}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
