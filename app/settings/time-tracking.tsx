import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';

export default function TimeTrackingScreen() {
  const router = useRouter();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const active = useMemo(() => (tab === 'timesheets' || tab === 'timer' ? tab : 'projects'), [tab]);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  React.useEffect(() => {
    if (!running) return;
    const handle = setInterval(() => setSeconds((prev) => prev + 1), 1000);
    return () => clearInterval(handle);
  }, [running]);

  const time = `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>Time Tracking</Text>
        <View style={{ width: 30 }} />
      </View>

      <View style={styles.tabs}>
        {['projects', 'timesheets', 'timer'].map((name) => (
          <Pressable key={name} onPress={() => router.replace(`/settings/time-tracking?tab=${name}`)} style={[styles.tab, active === name && styles.tabActive]}>
            <Text style={[styles.tabText, active === name && styles.tabTextActive]}>{name[0].toUpperCase() + name.slice(1)}</Text>
          </Pressable>
        ))}
      </View>

      {active === 'projects' ? (
        <View style={styles.card}><Text style={styles.main}>No projects yet</Text><Text style={styles.sub}>Create projects to map invoice line items to tracked work.</Text></View>
      ) : null}
      {active === 'timesheets' ? (
        <View style={styles.card}><Text style={styles.main}>No timesheets yet</Text><Text style={styles.sub}>Timesheets will appear here once timer entries are saved.</Text></View>
      ) : null}
      {active === 'timer' ? (
        <View style={styles.card}>
          <Text style={styles.main}>Live Timer</Text>
          <Text style={styles.timer}>{time}</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable onPress={() => setRunning((prev) => !prev)} style={styles.timerBtn}>
              <Text style={styles.timerBtnText}>{running ? 'Pause' : 'Start'}</Text>
            </Pressable>
            <Pressable onPress={() => { setRunning(false); setSeconds(0); }} style={[styles.timerBtn, { backgroundColor: Colors.surfaceTertiary }]}>
              <Text style={[styles.timerBtnText, { color: Colors.textSecondary }]}>Reset</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surfaceSecondary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface },
  backBtn: { padding: 4 },
  title: { ...Typography.heading, color: Colors.text, includeFontPadding: false },
  tabs: { flexDirection: 'row', gap: 8, padding: Spacing.xl },
  tab: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.md, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  tabActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  tabText: { ...Typography.label, color: Colors.textSecondary, includeFontPadding: false },
  tabTextActive: { color: Colors.primary },
  card: { marginHorizontal: Spacing.xl, borderRadius: Radius.lg, backgroundColor: Colors.surface, padding: Spacing.lg, gap: 10 },
  main: { ...Typography.subheading, color: Colors.text, includeFontPadding: false },
  sub: { ...Typography.body, color: Colors.textSecondary, includeFontPadding: false },
  timer: { ...Typography.hero, color: Colors.primary, includeFontPadding: false },
  timerBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 10, paddingHorizontal: 16 },
  timerBtnText: { ...Typography.button, color: '#fff', includeFontPadding: false },
});
