import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../AuthContext';
import { errorMessage } from '../api';
import { APP_NAME, TAGLINE } from '../config';
import { colors, radius } from '../theme';
import { Button } from '../components/ui';

const OTP_LENGTH = 6;
const isValidPhone = (p) => /^[6-9]\d{9}$/.test(p);

/** One screen for both login and sign-up: enter mobile number, then the OTP. */
export default function LoginScreen() {
  const { sendOtp, verifyOtp } = useAuth();
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [timer, setTimer] = useState(0);
  const [devOtp, setDevOtp] = useState(null);
  const otpInput = useRef(null);

  useEffect(() => {
    if (timer <= 0) return undefined;
    const id = setTimeout(() => setTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timer]);

  const send = async () => {
    if (!isValidPhone(phone)) return setError('Enter a valid 10-digit mobile number.');
    setBusy(true);
    setError(null);
    try {
      const data = await sendOtp(phone);
      setDevOtp(__DEV__ ? data.dev_otp || null : null);
      setOtp('');
      setStep('otp');
      setTimer(data.resend_after || 30);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const verify = async (code) => {
    if (code.length !== OTP_LENGTH) return;
    setBusy(true);
    setError(null);
    try {
      await verifyOtp(phone, code); // on success the app moves to the next screen automatically
    } catch (e) {
      setError(errorMessage(e));
      setOtp('');
      setBusy(false);
      otpInput.current?.focus();
    }
  };

  const onOtpChange = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setOtp(digits);
    setError(null);
    if (digits.length === OTP_LENGTH) verify(digits);
  };

  const changeNumber = () => { setStep('phone'); setOtp(''); setError(null); setDevOtp(null); };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.primary }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <SafeAreaView edges={['top']} style={s.hero}>
          <Text style={s.logo} accessibilityRole="header">{APP_NAME}</Text>
          <Text style={s.tagline}>{TAGLINE}</Text>
        </SafeAreaView>

        <View style={s.sheet}>
          {step === 'phone' ? (
            <>
              <Text style={s.title}>Log in or sign up</Text>
              <Text style={s.sub}>We'll send a 6-digit code to verify your number.</Text>

              <Text style={s.label}>Mobile number</Text>
              <View style={[s.phoneRow, error && { borderColor: colors.danger }]}>
                <Text style={s.prefix}>+91</Text>
                <TextInput
                  value={phone}
                  onChangeText={(v) => { setPhone(v.replace(/\D/g, '').slice(0, 10)); setError(null); }}
                  keyboardType="number-pad"
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  placeholderTextColor="#A8A190"
                  style={s.phoneInput}
                  autoFocus
                  autoComplete="tel"
                  textContentType="telephoneNumber"
                  accessibilityLabel="Mobile number"
                  onSubmitEditing={send}
                  returnKeyType="done"
                />
              </View>
              {error ? <Text style={s.error} accessibilityRole="alert">{error}</Text> : null}

              <Button title="Send OTP" onPress={send} loading={busy} disabled={!isValidPhone(phone)} style={{ marginTop: 18 }} />
            </>
          ) : (
            <>
              <Text style={s.title}>Enter verification code</Text>
              <Text style={s.sub}>
                Sent to +91 {phone}.{' '}
                <Text style={s.link} onPress={changeNumber} accessibilityRole="button">Change number</Text>
              </Text>

              <Pressable onPress={() => otpInput.current?.focus()} style={s.otpRow} accessibilityLabel="One-time password">
                {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                  <View key={i} style={[s.otpBox, otp.length === i && s.otpBoxActive, error && s.otpBoxError]}>
                    <Text style={s.otpDigit}>{otp[i] || ''}</Text>
                  </View>
                ))}
                <TextInput
                  ref={otpInput}
                  value={otp}
                  onChangeText={onOtpChange}
                  keyboardType="number-pad"
                  maxLength={OTP_LENGTH}
                  autoFocus
                  autoComplete="sms-otp"
                  textContentType="oneTimeCode"
                  style={s.hiddenInput}
                  caretHidden
                  editable={!busy}
                />
              </Pressable>
              {error ? <Text style={s.error} accessibilityRole="alert">{error}</Text> : null}

              <Button title="Verify and continue" onPress={() => verify(otp)} loading={busy}
                disabled={otp.length !== OTP_LENGTH} style={{ marginTop: 18 }} />

              <View style={{ alignItems: 'center', marginTop: 18 }}>
                {timer > 0 ? (
                  <Text style={s.muted}>Resend OTP in 0:{String(timer).padStart(2, '0')}</Text>
                ) : (
                  <Text style={s.link} onPress={send} accessibilityRole="button">Resend OTP</Text>
                )}
              </View>

              {devOtp ? <Text style={s.dev}>Test mode: your OTP is {devOtp}</Text> : null}
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  hero: { paddingHorizontal: 28, paddingTop: 48, paddingBottom: 36 },
  logo: { fontSize: 42, fontWeight: '900', color: colors.ink, letterSpacing: -1.2 },
  tagline: { fontSize: 17, color: colors.ink, opacity: 0.75, marginTop: 4, fontWeight: '600' },
  sheet: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingTop: 28 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  sub: { color: colors.muted, marginTop: 6, marginBottom: 22, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 6 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, height: 54 },
  prefix: { paddingHorizontal: 14, fontSize: 16, fontWeight: '800', color: colors.text, borderRightWidth: 1, borderRightColor: colors.border },
  phoneInput: { flex: 1, paddingHorizontal: 14, fontSize: 17, color: colors.text, letterSpacing: 1 },
  error: { color: colors.danger, marginTop: 8, fontWeight: '600' },
  link: { color: colors.primaryDark, fontWeight: '800' },
  muted: { color: colors.muted },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between' },
  otpBox: { width: 48, height: 56, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  otpBoxActive: { borderColor: colors.primaryDark, borderWidth: 2 },
  otpBoxError: { borderColor: colors.danger },
  otpDigit: { fontSize: 22, fontWeight: '800', color: colors.text },
  hiddenInput: { ...StyleSheet.absoluteFillObject, opacity: 0.01, color: 'transparent' },
  dev: { marginTop: 24, textAlign: 'center', fontSize: 12, color: colors.muted, backgroundColor: colors.surface, padding: 10, borderRadius: radius.sm },
});
