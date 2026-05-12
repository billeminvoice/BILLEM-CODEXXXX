import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useAlert } from '@/template';
import { Input, Button } from '@/components';
import { Colors, Spacing, Typography } from '@/constants/theme';

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const { showAlert } = useAlert();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password) {
      showAlert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      showAlert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      showAlert('Password Mismatch', 'Passwords do not match. Please try again.');
      return;
    }
    setLoading(true);
    try {
      await signUp(email.trim().toLowerCase(), password, name.trim());
      router.replace('/onboarding');
    } catch (e: any) {
      showAlert('Sign Up Failed', e.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={['#EFF6FF', '#FDF2F8']} style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
          </Pressable>
          <View style={styles.logoWrap}>
            <LinearGradient colors={['#3B82F6', '#818CF8', '#F472B6']} style={styles.logoGrad}>
              <MaterialIcons name="receipt-long" size={28} color="#fff" />
            </LinearGradient>
          </View>
        </LinearGradient>

        <View style={styles.form}>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Start invoicing in minutes — free forever</Text>

          <View style={styles.fields}>
            <Input
              label="Full name"
              placeholder="John Smith"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              leftIcon="person"
              required
            />
            <Input
              label="Email address"
              placeholder="you@company.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="email"
              required
            />
            <Input
              label="Password"
              placeholder="At least 6 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              leftIcon="lock"
              rightIcon={showPass ? 'visibility-off' : 'visibility'}
              onRightIconPress={() => setShowPass(!showPass)}
              required
            />
            <Input
              label="Confirm password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPass}
              leftIcon="lock-outline"
              required
            />
          </View>

          <Button title="Create Free Account" onPress={handleSignUp} loading={loading} fullWidth size="lg" />

          <Text style={styles.terms}>
            By creating an account you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.loginLink}>Sign in</Text>
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
  header: { paddingTop: 56, paddingBottom: 32, paddingHorizontal: Spacing.xl, alignItems: 'center' },
  backBtn: { position: 'absolute', top: 56, left: Spacing.xl, padding: 4, zIndex: 1 },
  logoWrap: { marginBottom: 4 },
  logoGrad: { width: 60, height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  form: { flex: 1, padding: Spacing.xl, gap: Spacing.md },
  title: { ...Typography.title, color: Colors.text, includeFontPadding: false },
  subtitle: { ...Typography.body, color: Colors.textSecondary, marginTop: 4, includeFontPadding: false },
  fields: { gap: Spacing.md },
  terms: { ...Typography.caption, color: Colors.textTertiary, textAlign: 'center', lineHeight: 20 },
  termsLink: { color: Colors.primary, fontWeight: '600' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  loginText: { ...Typography.body, color: Colors.textSecondary, includeFontPadding: false },
  loginLink: { ...Typography.body, color: Colors.primary, fontWeight: '600', includeFontPadding: false },
});
