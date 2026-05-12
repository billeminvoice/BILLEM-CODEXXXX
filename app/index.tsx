import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/constants/theme';

export default function Index() {
  const { user, isLoading, onboardingDone } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/auth/login');
    } else if (!onboardingDone) {
      router.replace('/onboarding');
    } else {
      router.replace('/(tabs)');
    }
  }, [user, isLoading, onboardingDone, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
});
