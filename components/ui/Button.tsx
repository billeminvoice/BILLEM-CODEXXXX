import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { Colors, Radius, Typography, Spacing } from '@/constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export function Button({
  title, onPress, variant = 'primary', size = 'md',
  loading, disabled, fullWidth, style, icon,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && { width: '100%' },
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? Colors.primary : Colors.textInverse} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`]]}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderRadius: Radius.md,
  },
  primary: { backgroundColor: Colors.primary },
  secondary: { backgroundColor: Colors.surfaceTertiary },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.primary },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: Colors.error },
  size_sm: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.sm },
  size_md: { paddingHorizontal: 20, paddingVertical: 13 },
  size_lg: { paddingHorizontal: 28, paddingVertical: 16, borderRadius: Radius.lg },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.45 },
  text: { ...Typography.button, includeFontPadding: false },
  text_primary: { color: Colors.textInverse },
  text_secondary: { color: Colors.text },
  text_outline: { color: Colors.primary },
  text_ghost: { color: Colors.primary },
  text_danger: { color: Colors.textInverse },
  textSize_sm: { ...Typography.buttonSm },
  textSize_md: {},
  textSize_lg: { fontSize: 16 },
});
