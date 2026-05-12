import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, ViewStyle, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Radius, Typography, Spacing, Shadow } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  required?: boolean;
}

export function Input({
  label, error, hint, leftIcon, rightIcon, onRightIconPress,
  containerStyle, required, ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={styles.label}>
          {label}{required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      ) : null}
      <View style={[styles.inputWrap, focused && styles.inputFocused, error ? styles.inputError : null]}>
        {leftIcon ? (
          <MaterialIcons name={leftIcon as any} size={18} color={focused ? Colors.primary : Colors.textTertiary} style={styles.leftIcon} />
        ) : null}
        <TextInput
          {...props}
          style={[styles.input, leftIcon ? styles.inputWithLeft : null, rightIcon ? styles.inputWithRight : null]}
          placeholderTextColor={Colors.textTertiary}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        />
        {rightIcon ? (
          <Pressable onPress={onRightIconPress} hitSlop={8}>
            <MaterialIcons name={rightIcon as any} size={18} color={Colors.textTertiary} style={styles.rightIcon} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {hint && !error ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { ...Typography.label, color: Colors.text },
  required: { color: Colors.error },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    ...Shadow.sm,
  },
  inputFocused: { borderColor: Colors.borderFocus },
  inputError: { borderColor: Colors.error },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    includeFontPadding: false,
  },
  inputWithLeft: { paddingLeft: 4 },
  inputWithRight: { paddingRight: 4 },
  leftIcon: { marginLeft: 12 },
  rightIcon: { marginRight: 12 },
  error: { ...Typography.caption, color: Colors.error },
  hint: { ...Typography.caption, color: Colors.textTertiary },
});
