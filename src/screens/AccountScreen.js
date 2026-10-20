import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../AuthContext';
import { colors, radius } from '../theme';
import { Button } from '../components/ui';

export default function AccountScreen({ navigation }) {
  const { user, logout } = useAuth();
  const details = [user.email, user.gender && user.gender[0].toUpperCase() + user.gender.slice(1), user.age && `${user.age} yrs`]
    .filter(Boolean).join('  |  ');

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={s.profile}>
          <View style={s.avatar}><Text style={s.initial}>{(user.name || '?')[0].toUpperCase()}</Text></View>
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Text style={s.name} accessibilityRole="header">{user.name}</Text>
            <Text style={s.muted}>+91 {user.phone}</Text>
            {details ? <Text style={s.muted} numberOfLines={1}>{details}</Text> : null}
          </View>
        </View>

        <MenuRow icon="person-outline" title="Edit profile" subtitle={user.email ? null : 'Add email, gender and age'}
          onPress={() => navigation.navigate('EditProfile')} />
        <MenuRow icon="location-outline" title="Saved addresses" onPress={() => navigation.navigate('Addresses')} />
        <MenuRow icon="receipt-outline" title="Your orders" onPress={() => navigation.navigate('Orders')} />
        <MenuRow icon="document-text-outline" title="Terms & Conditions" onPress={() => navigation.navigate('Terms')} />

        <Button title="Log out" variant="danger" onPress={logout} style={{ marginTop: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuRow({ icon, title, subtitle, onPress }) {
  return (
    <Pressable onPress={onPress} style={s.row} accessibilityRole="button" accessibilityLabel={title}>
      <Ionicons name={icon} size={22} color={colors.text} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={s.rowText}>{title}</Text>
        {subtitle ? <Text style={s.rowSub}>{subtitle}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.lg, padding: 18, marginBottom: 16 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  initial: { color: colors.primary, fontSize: 24, fontWeight: '900' },
  name: { fontSize: 20, fontWeight: '900', color: colors.ink },
  muted: { color: colors.ink, opacity: 0.7, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: radius.md, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  rowText: { fontSize: 15, fontWeight: '700', color: colors.text },
  rowSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
});
