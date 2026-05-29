import React, { createContext, useState, useCallback, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../theme/colors';

export const ThemeContext = createContext({ darkMode: false, toggleTheme: () => {}, t: {} });

// ── Theme token sets ──────────────────────────────────────────────────────────
const light = {
  dark: false,
  bg: COLORS.bgLight,
  card: COLORS.paperLight,
  cardBorder: '#e4e4e7',
  cardShadow: 'rgba(0,0,0,0.06)',
  text: COLORS.textPrimaryLight,
  textSub: COLORS.textSecondaryLight,
  textTertiary: COLORS.textTertiaryLight,
  tabBar: '#ffffff',
  tabBarBorder: '#e4e4e7',
  tabInactive: '#a1a1aa',
  drawerBg: '#ffffff',
  drawerActiveText: COLORS.primary,
  drawerActiveBg: COLORS.primaryMuted,
  inputBg: '#ffffff',
  inputBorder: '#e4e4e7',
  divider: '#f4f4f5',
  shimmer: '#f4f4f5',
  sectionLabel: COLORS.textSecondaryLight,
  chipBorder: '#d4d4d8',
  chipBg: '#f4f4f5',
};

const dark = {
  dark: true,
  bg: COLORS.bgDark,
  card: COLORS.paperDark,
  cardBorder: 'rgba(255,255,255,0.07)',
  cardShadow: 'rgba(0,0,0,0.45)',
  text: COLORS.textPrimaryDark,
  textSub: COLORS.textSecondaryDark,
  textTertiary: COLORS.textTertiaryDark,
  tabBar: '#111115',
  tabBarBorder: 'rgba(255,255,255,0.07)',
  tabInactive: '#52566a',
  drawerBg: '#111115',
  drawerActiveText: COLORS.primary,
  drawerActiveBg: COLORS.primaryMuted,
  inputBg: COLORS.paperDark,
  inputBorder: 'rgba(255,255,255,0.08)',
  divider: 'rgba(255,255,255,0.06)',
  shimmer: COLORS.canvasDark,
  sectionLabel: COLORS.textSecondaryDark,
  chipBorder: 'rgba(255,255,255,0.10)',
  chipBg: 'rgba(255,255,255,0.04)',
};

export const THEME = { light, dark };

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('sitsure_dark_mode')
      .then(v => { if (v === 'true') setDarkMode(true); })
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
    <ThemeContext.Provider value={{ darkMode, toggleTheme, t }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
