import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';

function LinkRow({ icon, label, value, url }: { icon: string; label: string; value: string; url: string }) {
  return (
    <Pressable onPress={() => Linking.openURL(url)} style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]}>
      <MaterialIcons name={icon as any} size={20} color={Colors.primary} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
      <MaterialIcons name="open-in-new" size={18} color={Colors.textTertiary} />
    </Pressable>
  );
}

export default function SupportScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>Help And Support</Text>
        <View style={{ width: 30 }} />
      </View>

      <View style={styles.card}>
        <LinkRow icon="mail-outline" label="Email Support" value="support@billem.app" url="mailto:support@billem.app" />
        <LinkRow icon="description" label="Knowledge Base" value="Guides and onboarding docs" url="https://billem.app/docs" />
        <LinkRow icon="privacy-tip" label="Privacy Policy" value="How we handle your data" url="https://billem.app/privacy" />
        <LinkRow icon="gavel" label="Terms of Service" value="Usage terms and billing policy" url="https://billem.app/terms" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surfaceSecondary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface },
  backBtn: { padding: 4 },
  title: { ...Typography.heading, color: Colors.text, includeFontPadding: false },
  card: { margin: Spacing.xl, borderRadius: Radius.lg, backgroundColor: Colors.surface, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  rowLabel: { ...Typography.label, color: Colors.text, includeFontPadding: false },
  rowValue: { ...Typography.caption, color: Colors.textTertiary, marginTop: 2, includeFontPadding: false },
});
