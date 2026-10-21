import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { errorMessage } from '../api';
import { useAuth } from '../AuthContext';
import { APP_NAME, ROLE } from '../config';
import { colors, radius } from '../theme';
import { Button, Input } from '../components/ui';

const WHAT_HAPPENS = {
  customer: [
    'Your name, phone number, email and saved addresses are erased.',
    'You are signed out and can no longer use this account.',
    'Past orders stay in our records without your personal details, as required for accounting.',
  ],
  restaurant: [
    'Your restaurant is removed from the app and stops receiving orders.',
    'Your login and contact details are erased.',
    'Order and payout records are kept for accounting. Any pending payout is still paid to your bank account.',
  ],
  delivery: [
    'Your login, contact details, documents and location are erased.',
    'You stop receiving delivery requests.',
    'Delivery and payout records are kept for accounting. Any pending payout is still paid to you.',
  ],
};

/** In-app account deletion (required by the App Store and Google Play). */
export default function DeleteAccountScreen() {
  const { deleteAccount } = useAuth();
  const isCustomer = ROLE === 'customer';
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const ready = isCustomer ? value.trim().toUpperCase() === 'DELETE' : value.length > 0;

  const submit = () => Alert.alert('Delete your account?', 'This cannot be undone.', [
    { text: 'Keep my account', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => {
      setBusy(true);
      try {
        await deleteAccount(isCustomer ? { confirm: 'DELETE' } : { password: value });
        Alert.alert('Account deleted', `Your ${APP_NAME} account has been deleted.`);
      } catch (e) {
        Alert.alert("Couldn't delete account", errorMessage(e));
        setBusy(false);
      }
    } },
  ]);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.surface }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <Text style={s.title} accessibilityRole="header">Delete your account</Text>
        <View style={s.card}>
          <Text style={s.cardTitle}>What happens</Text>
          {WHAT_HAPPENS[ROLE].map((line) => <Text key={line} style={s.item}>•  {line}</Text>)}
        </View>
        <Text style={s.note}>
          {isCustomer ? 'Orders in progress must be delivered first.'
            : ROLE === 'delivery' ? 'Finish any deliveries in progress and deposit any customer cash you hold first.'
            : 'Orders in progress must be completed first.'}
        </Text>

        {isCustomer ? (
          <Input label="Type DELETE to confirm" value={value} onChangeText={setValue} autoCapitalize="characters" placeholder="DELETE" />
        ) : (
          <Input label="Enter your password to confirm" value={value} onChangeText={setValue} secureTextEntry />
        )}
        <Button title="Delete my account" variant="danger" onPress={submit} loading={busy} disabled={!ready} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '900', color: colors.text, marginBottom: 14 },
  card: { backgroundColor: '#fff', borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.border },
  cardTitle: { fontWeight: '800', color: colors.text, marginBottom: 8 },
  item: { color: colors.text, lineHeight: 22, marginTop: 4 },
  note: { color: colors.muted, marginVertical: 16, lineHeight: 20 },
});
