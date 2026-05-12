import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '@/constants/theme';

export default function ExpensesScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>Expenses</Text>
        <View style={{ width: 30 }} />
      </View>

      <View style={styles.empty}>
        <MaterialIcons name="receipt-long" size={58} color={Colors.border} />
        <Text style={styles.emptyTitle}>No expenses tracked yet</Text>
        <Text style={styles.emptySubtitle}>Expense tracking is ready for your next phase. We can wire expense OCR next.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surfaceSecondary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface },
  backBtn: { padding: 4 },
  title: { ...Typography.heading, color: Colors.text, includeFontPadding: false },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: Spacing.xl },
  emptyTitle: { ...Typography.subheading, color: Colors.textSecondary, includeFontPadding: false },
  emptySubtitle: { ...Typography.body, color: Colors.textTertiary, textAlign: 'center', includeFontPadding: false },
});
