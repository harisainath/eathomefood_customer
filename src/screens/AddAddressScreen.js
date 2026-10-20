import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api, { errorMessage } from '../api';
import { useLocation } from '../LocationContext';
import { getDeviceLocation } from '../geo';
import { colors, radius } from '../theme';
import { Banner, Button, Chip, Input } from '../components/ui';

const LABELS = ['Home', 'Work', 'Other'];
// Google bills autocomplete per "session" (typing + one details lookup), so we group requests with a token
const newSession = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/** Search an address with Google Places (via our server), then add house number and landmark. */
export default function AddAddressScreen({ navigation, route }) {
  const loc = useLocation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [selected, setSelected] = useState(null); // { place_id, formatted_address, lat, lng, city, pincode }
  const [picking, setPicking] = useState(false);
  const [locating, setLocating] = useState(false);
  const [form, setForm] = useState({ label: 'Home', house: '', landmark: '' });
  const [saving, setSaving] = useState(false);
  const session = useRef(newSession());
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    const q = query.trim();
    if (selected || q.length < 3) { setResults([]); return undefined; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get('/places/autocomplete', {
          params: { input: q, lat: loc.coords?.lat, lng: loc.coords?.lng, session: session.current },
        });
        setResults(data);
        setSearchError(null);
      } catch (e) {
        setSearchError(errorMessage(e));
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [query, selected, loc.coords?.lat, loc.coords?.lng]);

  const pick = async (p) => {
    setPicking(true);
    try {
      const { data } = await api.get(`/places/details/${encodeURIComponent(p.place_id)}`, { params: { session: session.current } });
      session.current = newSession();
      setSelected(data);
      setResults([]);
    } catch (e) {
      Alert.alert("Couldn't load that address", errorMessage(e));
    } finally {
      setPicking(false);
    }
  };

  const useCurrent = async () => {
    setLocating(true);
    try {
      const { coords, place } = await getDeviceLocation();
      setSelected({ place_id: null, formatted_address: place.subtitle, lat: coords.lat, lng: coords.lng, city: place.city, pincode: place.pincode });
    } catch (e) {
      Alert.alert(e.code === 'denied' ? 'Location permission needed' : "Couldn't find your location",
        e.code === 'denied' ? 'Allow location access in Settings, or search for your address instead.' : 'Turn on location (GPS) or search for your address instead.');
    } finally {
      setLocating(false);
    }
  };

  const save = async () => {
    if (!form.house.trim()) return Alert.alert('Add house or flat number', 'This helps the delivery partner find your door.');
    setSaving(true);
    try {
      const { data } = await api.post('/addresses', {
        label: form.label,
        house: form.house.trim(),
        line1: selected.formatted_address,
        line2: form.landmark.trim() || null,
        city: selected.city,
        pincode: selected.pincode,
        place_id: selected.place_id,
        lat: selected.lat,
        lng: selected.lng,
      });
      loc.selectAddress(data); // a new address becomes the delivery location
      if (route.params?.fromSelect) navigation.pop(2); // straight back to Home
      else navigation.goBack();
    } catch (e) {
      Alert.alert("Couldn't save address", errorMessage(e));
      setSaving(false);
    }
  };

  if (selected) {
    return (
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.surface }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
          <View style={s.selected}>
            <Ionicons name="location" size={24} color={colors.primaryDark} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={s.selectedText}>{selected.formatted_address}</Text>
              <Text style={s.link} onPress={() => setSelected(null)} accessibilityRole="button">Change</Text>
            </View>
          </View>

          <Input label="House / flat / floor" value={form.house} onChangeText={set('house')} placeholder="e.g. Flat 302, Sai Residency" autoFocus maxLength={150} />
          <Input label="Landmark (optional)" value={form.landmark} onChangeText={set('landmark')} placeholder="e.g. Near City Hospital" maxLength={200} />

          <Text style={s.fieldLabel}>Save as</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14 }}>
            {LABELS.map((l) => <Chip key={l} label={l} selected={form.label === l} onPress={() => set('label')(l)} />)}
          </View>

          <Button title="Save address" onPress={save} loading={saving} disabled={!form.house.trim()} />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={s.searchWrap}>
        <View style={s.search}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Search area, street or building"
            placeholderTextColor={colors.muted} style={s.searchInput} autoFocus returnKeyType="search"
            accessibilityLabel="Search for your address" />
          {searching || picking ? <ActivityIndicator size="small" color={colors.primaryDark} /> : null}
        </View>
      </View>

      <FlatList
        data={results}
        keyExtractor={(p) => p.place_id}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <>
            <Pressable onPress={useCurrent} style={s.row} disabled={locating} accessibilityRole="button">
              {locating ? <ActivityIndicator size="small" color={colors.primaryDark} /> : <Ionicons name="navigate" size={20} color={colors.primaryDark} />}
              <Text style={[s.main, { color: colors.primaryDark, marginLeft: 12 }]}>Use my current location</Text>
            </Pressable>
            {searchError ? <Banner tone="error" text={searchError} style={{ margin: 16 }} /> : null}
          </>
        }
        ListEmptyComponent={query.trim().length >= 3 && !searching && !searchError
          ? <Text style={s.hint}>No matching places. Try a nearby landmark or street name.</Text>
          : query.trim().length < 3 ? <Text style={s.hint}>Type at least 3 letters to search.</Text> : null}
        renderItem={({ item: p }) => (
          <Pressable onPress={() => pick(p)} style={s.row} disabled={picking} accessibilityRole="button" accessibilityLabel={p.description}>
            <Ionicons name="location-outline" size={20} color={colors.muted} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.main} numberOfLines={1}>{p.main_text}</Text>
              {p.secondary_text ? <Text style={s.secondary} numberOfLines={1}>{p.secondary_text}</Text> : null}
            </View>
          </Pressable>
        )}
        ListFooterComponent={results.length ? <Text style={s.google}>Powered by Google</Text> : null}
      />
    </View>
  );
}

const s = StyleSheet.create({
  searchWrap: { padding: 16, paddingBottom: 8 },
  search: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: 14, height: 50, borderWidth: 1.5, borderColor: colors.border },
  searchInput: { flex: 1, marginHorizontal: 8, fontSize: 15, color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  main: { fontSize: 15, fontWeight: '700', color: colors.text },
  secondary: { color: colors.muted, marginTop: 2, fontSize: 13 },
  hint: { color: colors.muted, textAlign: 'center', padding: 24 },
  google: { textAlign: 'right', color: colors.muted, fontSize: 11, padding: 12 },
  selected: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fff', padding: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginBottom: 18 },
  selectedText: { color: colors.text, fontWeight: '700', lineHeight: 20 },
  link: { color: colors.primaryDark, fontWeight: '800', marginTop: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 8 },
});
