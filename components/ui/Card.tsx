import React from 'react';
import { Pressable, View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'default' | 'flat' | 'outlined';
  padding?: number;
}

export function Card({ children, onPress, style, variant = 'default', padding = Spacing.md }: CardProps) {
  const cardStyle = [
    styles.card,
    variant === 'default' && styles.shadow,
    variant === 'outlined' && styles.outlined,
    { padding },
    style,
  ];
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [...cardStyle, pressed && styles.pressed]}>
        {children}
      </Pressable>
    );
  }
  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
  },
  shadow: Shadow.md as ViewStyle,
  outlined: { borderWidth: 1, borderColor: Colors.border },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
});
