import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

export default function Loader({ color, size = 10, style }) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  const pulse = (anim, delay) =>
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.delay(400),
      ])
    );

  useEffect(() => {
    const a1 = pulse(dot1, 0);
    const a2 = pulse(dot2, 160);
    const a3 = pulse(dot3, 320);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  const dotStyle = (anim) => ({
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: color || COLORS.primary,
    marginHorizontal: size * 0.4,
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.2] }) }],
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
  });

  return (
    <View style={[styles.wrap, style]}>
      <Animated.View style={dotStyle(dot1)} />
      <Animated.View style={dotStyle(dot2)} />
      <Animated.View style={dotStyle(dot3)} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
