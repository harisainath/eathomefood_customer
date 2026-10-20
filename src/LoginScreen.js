import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from './AuthContext';
import { errorMessage } from './api';
import { APP_NAME, DEMO_EMAIL, ROLE, TAGLINE } from './config';
import { colors, radius } from './theme';
import { Button, Input } from './components/ui';

export default function LoginScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: '', email: DEMO_EMAIL, phone: '', password: 'password', restaurant_name: '', vehicle_number: '',
  });
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const isRegister = mode === 'register';

  const submit = async () => {
    setBusy(true);
    try {
      const email = form.email.trim().toLowerCase();
      if (isRegister) await register({ ...form, email });
      else await login(email, form.password);
    } catch (e) {
      Alert.alert(isRegister ? "Couldn't create account" : "Couldn't log in", errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.primary }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <SafeAreaView edges={['top']} style={s.hero}>
          <Text style={s.logo}>{APP_NAME}</Text>
          <Text style={s.tagline}>{TAGLINE}</Text>
        </SafeAreaView>

        <View style={s.sheet}>
          <Text style={s.title}>{isRegister ? 'Create your account' : 'Log in'}</Text>

          {isRegister && <Input label="Full name" value={form.name} onChangeText={set('name')} placeholder="Your name" />}
          {isRegister && ROLE === 'restaurant' && (
            <Input label="Restaurant name" value={form.restaurant_name} onChangeText={set('restaurant_name')} placeholder="e.g. Anna's Kitchen" />
          )}
          <Input label="Email" value={form.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" />
          {isRegister && <Input label="Phone" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" placeholder="10-digit mobile number" />}
          {isRegister && ROLE === 'delivery' && (
            <Input label="Vehicle number" value={form.vehicle_number} onChangeText={set('vehicle_number')} autoCapitalize="characters" placeholder="TN 07 AB 1234" />
          )}
          <Input label="Password" value={form.password} onChangeText={set('password')} secureTextEntry placeholder="At least 6 characters" />

          <Button title={isRegister ? 'Create account' : 'Log in'} onPress={submit} loading={busy} style={{ marginTop: 6 }} />

          <Pressable onPress={() => setMode(isRegister ? 'login' : 'register')} style={{ marginTop: 20, alignItems: 'center' }}>
            <Text style={s.switch}>
              {isRegister ? 'Already have an account? ' : 'New here? '}
              <Text style={{ fontWeight: '800', color: colors.text }}>{isRegister ? 'Log in' : 'Create an account'}</Text>
            </Text>
          </Pressable>

          {!isRegister && <Text style={s.demo}>Demo login is pre-filled: {DEMO_EMAIL} / password</Text>}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  hero: { paddingHorizontal: 28, paddingTop: 48, paddingBottom: 36 },
  logo: { fontSize: 46, fontWeight: '900', color: colors.ink, letterSpacing: -1.5 },
  tagline: { fontSize: 17, color: colors.ink, opacity: 0.75, marginTop: 4, fontWeight: '600' },
  sheet: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingTop: 28 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 20 },
  switch: { color: colors.muted, fontSize: 14 },
  demo: { marginTop: 24, textAlign: 'center', fontSize: 12, color: colors.muted, backgroundColor: colors.surface, padding: 10, borderRadius: radius.sm },
});
