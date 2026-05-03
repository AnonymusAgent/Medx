import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth, useAlert } from '@/template';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/theme';

type Mode = 'login' | 'register' | 'otp';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signInWithPassword, signUpWithPassword, sendOTP, verifyOTPAndLogin, operationLoading } =
    useAuth();
  const { showAlert } = useAlert();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPass, setShowPass] = useState(false);

  // ── Login ──────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!email.trim() || !password) {
      showAlert('Required', 'Please enter your email and password.');
      return;
    }
    const { error } = await signInWithPassword(email.trim().toLowerCase(), password);
    if (error) showAlert('Login Failed', error);
  };

  // ── Register Step 1: send OTP ──────────────────────────────────────────────
  const handleRegister = async () => {
    if (!email.trim() || !password || !confirmPassword) {
      showAlert('Required', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      showAlert('Password Mismatch', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      showAlert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    const { error } = await sendOTP(email.trim().toLowerCase());
    if (error) {
      showAlert('Error', error);
      return;
    }
    setMode('otp');
  };

  // ── Register Step 2: verify OTP ────────────────────────────────────────────
  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      showAlert('Required', 'Please enter the verification code.');
      return;
    }
    const { error } = await verifyOTPAndLogin(email.trim().toLowerCase(), otp, { password });
    if (error) showAlert('Verification Failed', error);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.logoWrap}>
            <MaterialIcons name="local-hospital" size={36} color="#fff" />
          </View>
          <Text style={styles.appName}>MedBillPro</Text>
          <Text style={styles.appTagline}>Medical Billing & Practice Management</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {/* Tab Switcher */}
          {mode !== 'otp' && (
            <View style={styles.modeTabs}>
              <Pressable
                onPress={() => setMode('login')}
                style={[styles.modeTab, mode === 'login' && styles.modeTabActive]}
              >
                <Text style={[styles.modeTabText, mode === 'login' && styles.modeTabTextActive]}>
                  Sign In
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setMode('register')}
                style={[styles.modeTab, mode === 'register' && styles.modeTabActive]}
              >
                <Text
                  style={[styles.modeTabText, mode === 'register' && styles.modeTabTextActive]}
                >
                  Create Account
                </Text>
              </Pressable>
            </View>
          )}

          {/* OTP Verification */}
          {mode === 'otp' && (
            <>
              <View style={styles.otpHeader}>
                <View style={styles.otpIconWrap}>
                  <MaterialIcons name="mark-email-read" size={28} color={Colors.primary} />
                </View>
                <Text style={styles.otpTitle}>Check Your Email</Text>
                <Text style={styles.otpSub}>
                  We sent a 4-digit code to{'\n'}
                  <Text style={{ fontWeight: '700', color: Colors.textPrimary }}>{email}</Text>
                </Text>
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Verification Code</Text>
                <TextInput
                  style={styles.input}
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="Enter 4-digit code"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={6}
                  textAlign="center"
                />
              </View>
              <Pressable
                style={[styles.primaryBtn, operationLoading && styles.btnDisabled]}
                onPress={handleVerifyOTP}
                disabled={operationLoading}
              >
                {operationLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="verified" size={18} color="#fff" />
                    <Text style={styles.primaryBtnText}>Verify & Create Account</Text>
                  </>
                )}
              </Pressable>
              <Pressable onPress={() => setMode('register')} style={styles.linkRow}>
                <Text style={styles.linkText}>Back to registration</Text>
              </Pressable>
            </>
          )}

          {/* Login Form */}
          {mode === 'login' && (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@practice.com"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passWrap}>
                  <TextInput
                    style={styles.passInput}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Your password"
                    placeholderTextColor={Colors.textMuted}
                    secureTextEntry={!showPass}
                    autoCapitalize="none"
                  />
                  <Pressable onPress={() => setShowPass(v => !v)} hitSlop={8}>
                    <MaterialIcons
                      name={showPass ? 'visibility-off' : 'visibility'}
                      size={20}
                      color={Colors.textMuted}
                    />
                  </Pressable>
                </View>
              </View>
              <Pressable
                style={[styles.primaryBtn, operationLoading && styles.btnDisabled]}
                onPress={handleLogin}
                disabled={operationLoading}
              >
                {operationLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="login" size={18} color="#fff" />
                    <Text style={styles.primaryBtnText}>Sign In</Text>
                  </>
                )}
              </Pressable>
            </>
          )}

          {/* Register Form */}
          {mode === 'register' && (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Dr. Jane Smith"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Work Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@practice.com"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passWrap}>
                  <TextInput
                    style={styles.passInput}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Min 6 characters"
                    placeholderTextColor={Colors.textMuted}
                    secureTextEntry={!showPass}
                    autoCapitalize="none"
                  />
                  <Pressable onPress={() => setShowPass(v => !v)} hitSlop={8}>
                    <MaterialIcons
                      name={showPass ? 'visibility-off' : 'visibility'}
                      size={20}
                      color={Colors.textMuted}
                    />
                  </Pressable>
                </View>
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Repeat password"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.roleInfo}>
                <MaterialIcons name="info" size={14} color={Colors.primary} />
                <Text style={styles.roleInfoText}>
                  New accounts are assigned{' '}
                  <Text style={{ fontWeight: '700' }}>Biller</Text> role by default. An Admin can
                  change your role in Settings.
                </Text>
              </View>
              <Pressable
                style={[styles.primaryBtn, operationLoading && styles.btnDisabled]}
                onPress={handleRegister}
                disabled={operationLoading}
              >
                {operationLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="person-add" size={18} color="#fff" />
                    <Text style={styles.primaryBtnText}>Send Verification Code</Text>
                  </>
                )}
              </Pressable>
            </>
          )}
        </View>

        {/* HIPAA badge */}
        <View style={styles.hipaaRow}>
          <MaterialIcons name="security" size={14} color="rgba(255,255,255,0.4)" />
          <Text style={styles.hipaaText}>HIPAA Compliant · AES-256 Encrypted · SOC 2 Type II</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.navBg },
  scroll: { flexGrow: 1, padding: Spacing.md, paddingBottom: 40 },

  hero: { alignItems: 'center', paddingVertical: Spacing.lg },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    ...Shadow.lg,
  },
  appName: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  appTagline: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.5)', marginTop: 4 },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Shadow.lg,
  },

  modeTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    padding: 3,
    marginBottom: 4,
  },
  modeTab: { flex: 1, paddingVertical: 9, borderRadius: Radius.sm - 2, alignItems: 'center' },
  modeTabActive: { backgroundColor: Colors.surface, ...Shadow.sm },
  modeTabText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textMuted },
  modeTabTextActive: { color: Colors.primary },

  otpHeader: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  otpIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  otpSub: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  field: { gap: 5 },
  label: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 13,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    backgroundColor: Colors.surfaceAlt,
  },
  passWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surfaceAlt,
  },
  passInput: { flex: 1, paddingVertical: 13, fontSize: FontSize.base, color: Colors.textPrimary },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    gap: 8,
    marginTop: 4,
    ...Shadow.md,
  },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { fontSize: FontSize.base, fontWeight: '700', color: '#fff' },

  linkRow: { alignItems: 'center', paddingVertical: 4 },
  linkText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },

  roleInfo: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: Colors.primaryLight,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    alignItems: 'flex-start',
  },
  roleInfoText: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.primaryDark,
    lineHeight: 18,
  },

  hipaaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: Spacing.lg,
  },
  hipaaText: { fontSize: 10, color: 'rgba(255,255,255,0.35)' },
});
