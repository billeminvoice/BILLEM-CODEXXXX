import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useAuth } from '@/hooks/useAuth';
import { useAlert } from '@/template';
import { Input, Button } from '@/components';
import { Colors, Spacing, Typography } from '@/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { showAlert } = useAlert();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      showAlert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
      router.replace('/');
    } catch (e: any) {
      showAlert('Sign In Failed', e.message || 'Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <LinearGradient colors={['#EFF6FF', '#FDF2F8']} style={styles.header}>
          <View style={styles.logoWrap}>
            <Image source={require('@/assets/images/brand-logo.png')} style={styles.logoImg} contentFit="cover" />
          </View>
          <Text style={styles.appName}>Bill&apos;em Invoice</Text>
          <Text style={styles.tagline}>Smart invoicing powered by AI</Text>
        </LinearGradient>

        <View style={styles.form}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

          <View style={styles.fields}>
            <Input
              label="Email address"
              placeholder="you@company.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              leftIcon="email"
              required
            />
            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              leftIcon="lock"
              rightIcon={showPass ? 'visibility-off' : 'visibility'}
              onRightIconPress={() => setShowPass(!showPass)}
              required
            />
          </View>

          <Pressable style={styles.forgotWrap}>
            <Text style={styles.forgot}>Forgot password?</Text>
          </Pressable>

          <Button title="Sign In" onPress={handleLogin} loading={loading} fullWidth size="lg" />

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Don&apos;t have an account? </Text>
            <Pressable onPress={() => router.push('/auth/signup')}>
              <Text style={styles.signupLink}>Create account</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  content: { flexGrow: 1 },
  header: { alignItems: 'center', paddingTop: 72, paddingBottom: 40, paddingHorizontal: Spacing.xl },
  logoWrap: { marginBottom: 12 },
  logoImg: { width: 72, height: 72, borderRadius: 20 },
  appName: { ...Typography.hero, color: Colors.text, includeFontPadding: false },
  tagline: { ...Typography.body, color: Colors.textSecondary, marginTop: 4, includeFontPadding: false },
  form: { flex: 1, padding: Spacing.xl, gap: Spacing.md },
  title: { ...Typography.title, color: Colors.text, includeFontPadding: false },
  subtitle: { ...Typography.body, color: Colors.textSecondary, marginTop: 4, includeFontPadding: false },
  fields: { gap: Spacing.md },
  forgotWrap: { alignSelf: 'flex-end' },
  forgot: { ...Typography.label, color: Colors.primary, includeFontPadding: false },
  signupRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  signupText: { ...Typography.body, color: Colors.textSecondary, includeFontPadding: false },
  signupLink: { ...Typography.body, color: Colors.primary, fontWeight: '600', includeFontPadding: false },
});
