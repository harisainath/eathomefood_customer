import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../AuthContext';
import { errorMessage } from '../api';
import { getDeviceLocation } from '../geo';
import { colors, radius } from '../theme';
import { Button, Checkbox, Input } from '../components/ui';

/** Shown once after the first OTP login: name, terms acceptance and location. */
export default function CompleteProfileScreen({ navigation, route }) {
  const { user, completeRegistration, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [agreed, setAgreed] = useState(false);
  const [loc, setLoc] = useState({ status: 'locating' });
  const [busy, setBusy] = useState(false);

  // Tapping "I agree" at the bottom of the Terms screen comes back here with this flag
  useEffect(() => {
    if (route.params?.termsAccepted) setAgreed(true);
  }, [route.params?.termsAccepted]);

  const captureLocation = useCallback(async () => {
    setLoc({ status: 'locating' });
    try {
      const { coords, place } = await getDeviceLocation();
      setLoc({ status: 'ready', coords, text: place.subtitle || place.label });
    } catch (e) {
      setLoc({ status: e.code === 'denied' ? 'denied' : 'error', message: e.message });
    }
  }, []);

  useEffect(() => { captureLocation(); }, [captureLocation]);

  const canSubmit = name.trim().length >= 2 && agreed && loc.status === 'ready';

  const submit = async () => {
    setBusy(true);
    try {
      await completeRegistration({ name: name.trim(), lat: loc.coords.lat, lng: loc.coords.lng });
    } catch (e) {
      Alert.alert("Couldn't finish sign-up", errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
          <Text style={s.title} accessibilityRole="header">Welcome! 👋</Text>
          <Text style={s.sub}>Just one step to get started.</Text>

          <Input label="What should we call you?" value={name} onChangeText={setName} placeholder="Your name"
            autoFocus autoCapitalize="words" maxLength={60} returnKeyType="done" />

          <View style={s.locCard}>
            <Ionicons name={loc.status === 'ready' ? 'location' : 'location-outline'} size={22}
              color={loc.status === 'ready' ? colors.success : colors.primaryDark} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              {loc.status === 'locating' && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={colors.primaryDark} />
                  <Text style={[s.locText, { marginLeft: 8 }]}>Finding your location…</Text>
                </View>
              )}
              {loc.status === 'ready' && (
                <>
                  <Text style={s.locTitle}>Your location</Text>
                  <Text style={s.locText} numberOfLines={2}>{loc.text}</Text>
                </>
              )}
              {loc.status === 'denied' && (
                <>
                  <Text style={s.locTitle}>Location permission needed</Text>
                  <Text style={s.locText}>We use it to show restaurants that deliver to you.</Text>
                  <Text style={s.link} onPress={() => Linking.openSettings()} accessibilityRole="button">Open settings</Text>
                </>
              )}
              {loc.status === 'error' && (
                <>
                  <Text style={s.locTitle}>Couldn't find your location</Text>
                  <Text style={s.locText}>Turn on location (GPS) and try again.</Text>
                  <Text style={s.link} onPress={captureLocation} accessibilityRole="button">Try again</Text>
                </>
              )}
            </View>
          </View>

          <Checkbox checked={agreed} onChange={setAgreed} style={{ marginTop: 22 }}>
            <Text style={s.terms}>
              I agree to the{' '}
              <Text style={s.link} onPress={() => navigation.navigate('Terms', { showAgree: true })} accessibilityRole="link">
                Terms & Conditions
              </Text>
            </Text>
          </Checkbox>

          <Button title="Continue" onPress={submit} loading={busy} disabled={!canSubmit} style={{ marginTop: 26 }} />

          <Text style={s.switch} onPress={logout} accessibilityRole="button">Use a different number</Text>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '900', color: colors.text, marginTop: 12 },
  sub: { color: colors.muted, marginTop: 6, marginBottom: 26, fontSize: 15 },
  locCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, borderWidth: 1, borderColor: colors.border },
  locTitle: { fontWeight: '800', color: colors.text },
  locText: { color: colors.muted, marginTop: 2, lineHeight: 19 },
  link: { color: colors.primaryDark, fontWeight: '800', marginTop: 4 },
  terms: { color: colors.text, fontSize: 15, lineHeight: 22 },
  switch: { textAlign: 'center', color: colors.muted, marginTop: 20, fontWeight: '600' },
});
