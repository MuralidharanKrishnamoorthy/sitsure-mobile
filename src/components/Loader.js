import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import Spinkit from 'react-native-spinkit';
import { COLORS } from '../theme/colors';

export default function Loader({ color, size = 48, style }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  return (
    <Animated.View style={[styles.wrap, style, { opacity }]}>
      <Spinkit type="9CubeGrid" color={color || COLORS.primary} size={size} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
