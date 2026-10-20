import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api, { errorMessage } from '../api';
import { useLocation } from '../LocationContext';
import { colors, radius } from '../theme';
import { Button, Card, EmptyState, Loader } from '../components/ui';

/** Saved addresses. With { selectMode: true } it also chooses the delivery location for Home. */
export default function AddressesScreen({ navigation, route }) {
  const selectMode = !!route.params?.selectMode;
  const loc = useLocation();
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    api.get('/addresses')
      .then(({ data }) => { setList(data); setError(null); })
      .catch((e) => setError(errorMessage(e)));
  }, []);
  useFocusEffect(load);

  const useCurrentLocation = () => { loc.locate(); navigation.goBack(); };

  const select = (a) => {
    if (a.lat == null || a.lng == null) {
      return Alert.alert('Address needs updating', 'This address has no map location. Please add it again using the address search.');
    }
    loc.selectAddress(a);
    navigation.goBack();
  };

  const remove = (a) => Alert.alert('Delete address?', [a.house, a.line1].filter(Boolean).join(', '), [
    { text: 'Keep', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => {
      try {
        await api.delete(`/addresses/${a.id}`);
        if (loc.addressId === a.id) loc.locate();
        load();
      } catch (e) { Alert.alert("Couldn't delete", errorMessage(e)); }
    } },
  ]);

  if (list === null && !error) return <Loader />;

  return (
    <FlatList
      style={{ backgroundColor: colors.surface }}
      contentContainerStyle={{ padding: 16, flexGrow: 1 }}
      data={list || []}
      keyExtractor={(a) => String(a.id)}
      ListHeaderComponent={selectMode ? (
        <Pressable onPress={useCurrentLocation} style={s.current} accessibilityRole="button">
          <Ionicons name="navigate" size={20} color={colors.primaryDark} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={s.label}>Use my current location</Text>
            <Text style={s.muted}>Show restaurants near where you are now</Text>
          </View>
          {loc.source === 'gps' && <Ionicons name="checkmark-circle" size={22} color={colors.success} />}
        </Pressable>
      ) : null}
      ListEmptyComponent={error
        ? <EmptyState emoji="📡" title="Couldn't load addresses" subtitle={error} action={<Button title="Try again" variant="outline" onPress={load} />} />
        : <EmptyState emoji="🏠" title="No saved addresses" subtitle="Add your home or work address for faster checkout." />}
      renderItem={({ item: a }) => {
        const selected = loc.source === 'address' && loc.addressId === a.id;
        return (
          <Pressable onPress={selectMode ? () => select(a) : undefined} disabled={!selectMode}
            accessibilityRole={selectMode ? 'button' : undefined}
            accessibilityLabel={`${a.label}: ${[a.house, a.line1].filter(Boolean).join(', ')}`}>
            <Card style={[s.addr, selected && s.addrOn]}>
              <Ionicons name={a.label === 'Work' ? 'briefcase-outline' : a.label === 'Home' ? 'home-outline' : 'location-outline'}
                size={22} color={colors.primaryDark} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.label}>{a.label}</Text>
                <Text style={s.muted}>{[a.house, a.line1, a.line2 && `Landmark: ${a.line2}`].filter(Boolean).join(', ')}</Text>
              </View>
              <Pressable onPress={() => remove(a)} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Delete ${a.label} address`}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </Pressable>
            </Card>
          </Pressable>
        );
      }}
      ListFooterComponent={
        <Button title="Add new address" variant={list?.length ? 'outline' : 'primary'} style={{ marginTop: 8 }}
          icon={<Ionicons name="add" size={18} color={colors.text} />}
          onPress={() => navigation.navigate('AddAddress', { fromSelect: selectMode })} />
      }
    />
  );
}

const s = StyleSheet.create({
  current: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: radius.lg, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  addr: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  addrOn: { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.primarySoft },
  label: { fontSize: 16, fontWeight: '800', color: colors.text },
  muted: { color: colors.muted, marginTop: 2, lineHeight: 19 },
});
