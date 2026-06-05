import React, {useRef, useCallback} from 'react';
import {View, TouchableOpacity, Text, StyleSheet} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import {COLORS} from '../../theme/colors';
import {useTheme} from '../../context/ThemeContext';

const MIN_SCALE = 0.4;
const MAX_SCALE = 2.8;
const ZOOM_STEP = 0.35;

/**
 * ZoomableFloorMap
 *
 * Wraps any floor layout with:
 *   - Pinch-to-zoom (react-native-gesture-handler PinchGesture)
 *   - Pan / drag to navigate (PanGesture)
 *   - + / - zoom buttons (bottom-right overlay)
 *   - Reset button (double-tap or reset button)
 *   - Zoom level badge
 *
 * Props:
 *   children  — the floor layout component
 *   style     — outer container style
 */
export default function ZoomableFloorMap({children, style}) {
  const {t} = useTheme();

  const scale       = useSharedValue(1);
  const savedScale  = useSharedValue(1);
  const translateX  = useSharedValue(0);
  const translateY  = useSharedValue(0);
  const savedTX     = useSharedValue(0);
  const savedTY     = useSharedValue(0);
  const focalX      = useSharedValue(0);
  const focalY      = useSharedValue(0);

  // ── Pinch gesture ─────────────────────────────────────────────────────────
  const pinch = Gesture.Pinch()
    .onBegin(e => {
      focalX.value = e.focalX;
      focalY.value = e.focalY;
    })
    .onUpdate(e => {
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, savedScale.value * e.scale));
      const delta = next - scale.value;
      scale.value = next;
      // Zoom toward focal point
      translateX.value = savedTX.value + (focalX.value - savedTX.value) * (1 - e.scale) * 0.5;
      translateY.value = savedTY.value + (focalY.value - savedTY.value) * (1 - e.scale) * 0.5;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      savedTX.value    = translateX.value;
      savedTY.value    = translateY.value;
    });

  // ── Pan gesture ───────────────────────────────────────────────────────────
  const pan = Gesture.Pan()
    .minDistance(4)
    .onUpdate(e => {
      translateX.value = savedTX.value + e.translationX;
      translateY.value = savedTY.value + e.translationY;
    })
    .onEnd(() => {
      savedTX.value = translateX.value;
      savedTY.value = translateY.value;
    });

  // ── Double-tap to reset ───────────────────────────────────────────────────
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      scale.value      = withSpring(1, {damping: 14, stiffness: 100});
      translateX.value = withSpring(0, {damping: 14});
      translateY.value = withSpring(0, {damping: 14});
      savedScale.value = 1;
      savedTX.value    = 0;
      savedTY.value    = 0;
    });

  const composed = Gesture.Simultaneous(pinch, pan, doubleTap);

  // ── Animated style ────────────────────────────────────────────────────────
  const animStyle = useAnimatedStyle(() => ({
    transform: [
      {translateX: translateX.value},
      {translateY: translateY.value},
      {scale: scale.value},
    ],
  }));

  // ── JS-side zoom buttons ──────────────────────────────────────────────────
  const zoomIn = useCallback(() => {
    const next = Math.min(MAX_SCALE, scale.value + ZOOM_STEP);
    scale.value      = withSpring(next, {damping: 14, stiffness: 120});
    savedScale.value = next;
  }, []);

  const zoomOut = useCallback(() => {
    const next = Math.max(MIN_SCALE, scale.value - ZOOM_STEP);
    scale.value      = withSpring(next, {damping: 14, stiffness: 120});
    savedScale.value = next;
    // If zooming back to ~1, snap translation to 0
    if (next <= 1.05) {
      translateX.value = withSpring(0, {damping: 14});
      translateY.value = withSpring(0, {damping: 14});
      savedTX.value    = 0;
      savedTY.value    = 0;
    }
  }, []);

  const reset = useCallback(() => {
    scale.value      = withSpring(1, {damping: 14, stiffness: 100});
    translateX.value = withSpring(0, {damping: 14});
    translateY.value = withSpring(0, {damping: 14});
    savedScale.value = 1;
    savedTX.value    = 0;
    savedTY.value    = 0;
  }, []);

  return (
    <GestureHandlerRootView style={[styles.root, style]}>
      <View style={styles.container}>
        {/* ── Gesture + animated floor ── */}
        <GestureDetector gesture={composed}>
          <Animated.View style={[styles.canvas, animStyle]}>
            {children}
          </Animated.View>
        </GestureDetector>

        {/* ── Zoom controls — bottom right ── */}
        <View style={[styles.controls, {backgroundColor: t.card, borderColor: t.cardBorder}]}>
          <TouchableOpacity
            style={[styles.ctrlBtn, {borderBottomColor: t.divider}]}
            onPress={zoomIn}
            activeOpacity={0.75}>
            <Text style={[styles.ctrlIcon, {color: COLORS.primary}]}>＋</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.ctrlBtn, {borderBottomColor: t.divider}]}
            onPress={zoomOut}
            activeOpacity={0.75}>
            <Text style={[styles.ctrlIcon, {color: COLORS.primary}]}>－</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ctrlBtn}
            onPress={reset}
            activeOpacity={0.75}>
            <Text style={[styles.ctrlIconSm, {color: t.textSub}]}>⊙</Text>
          </TouchableOpacity>
        </View>

        {/* ── Hint label ── */}
        <View style={[styles.hint, {backgroundColor: t.chipBg}]}>
          <Text style={[styles.hintText, {color: t.textTertiary}]}>
            Pinch or use ＋／－ to zoom · Double-tap to reset
          </Text>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  container: {flex: 1, overflow: 'hidden'},
  canvas: {flex: 1},

  // Zoom control pill — right side
  controls: {
    position: 'absolute',
    right: 12,
    bottom: 48,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  ctrlBtn: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
  },
  ctrlIcon: {
    fontSize: 20,
    fontWeight: '300',
    lineHeight: 24,
  },
  ctrlIconSm: {
    fontSize: 18,
    lineHeight: 22,
  },

  // Hint strip at bottom
  hint: {
    position: 'absolute',
    bottom: 8,
    left: 12,
    right: 64,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  hintText: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
});
