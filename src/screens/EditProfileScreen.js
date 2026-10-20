import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../AuthContext';
import { errorMessage } from '../api';
import { colors, radius } from '../theme';
import { Button, Chip, Input } from '../components/ui';

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

export default function EditProfileScreen({ navigation }) {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    name: user.name || '',
    email: user.email || '',
    gender: user.gender || null,
    age: user.age ? String(user.age) : '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (form.name.trim().length < 2) return Alert.alert('Check your name', 'Name must be at least 2 characters.');
    setSaving(true);
    try {
      await updateProfile({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase() || null,
        gender: form.gender,
        age: form.age ? Number(form.age) : null,
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert("Couldn't save profile", errorMessage(e));
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.surface }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <View style={s.phone}>
          <Text style={s.phoneLabel}>Mobile number</Text>
          <Text style={s.phoneValue}>+91 {user.phone}</Text>
        </View>

        <Input label="Name" value={form.name} onChangeText={set('name')} autoCapitalize="words" maxLength={60} />
        <Input label="Email (optional)" value={form.email} onChangeText={set('email')} autoCapitalize="none"
          keyboardType="email-address" placeholder="you@example.com" maxLength={150} />

        <Text style={s.label}>Gender (optional)</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
          {GENDERS.map((g) => (
            <Chip key={g.value} label={g.label} selected={form.gender === g.value}
              onPress={() => set('gender')(form.gender === g.value ? null : g.value)} />
          ))}
        </View>

        <Input label="Age (optional)" value={form.age} onChangeText={(v) => set('age')(v.replace(/\D/g, '').slice(0, 3))}
          keyboardType="number-pad" placeholder="e.g. 28" style={{ width: 140 }} />

        <Button title="Save changes" onPress={save} loading={saving} style={{ marginTop: 8 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  phone: { backgroundColor: '#fff', borderRadius: radius.md, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  phoneLabel: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  phoneValue: { color: colors.text, fontSize: 16, fontWeight: '800', marginTop: 2 },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 8 },
});
