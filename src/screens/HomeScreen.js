import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Linking, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api, { errorMessage } from '../api';
import { useAuth } from '../AuthContext';
import { useCart } from '../CartContext';
import { useAppConfig } from '../AppConfigContext';
import { useLocation } from '../LocationContext';
import { colors, radius, rupee } from '../theme';
import { Banner, Button, EmptyState, Loader } from '../components/ui';
import { CartBar, FoodArt, RatingPill } from '../components/food';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const cart = useCart();
  const { config } = useAppConfig();
  const loc = useLocation();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null); // { radius_km, restaurants }
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const lat = loc.coords?.lat;
  const lng = loc.coords?.lng;

  const load = useCallback(async (q = '') => {
    if (lat == null || lng == null) return;
    try {
      const { data } = await api.get('/restaurants', { params: { lat, lng, q } });
      setResult(data);
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [lat, lng]);

  // Reload when the location changes, debounce while typing a search
  useEffect(() => {
    if (lat == null) return undefined;
    const t = setTimeout(() => load(query), query ? 350 : 0);
    return () => clearTimeout(t);
  }, [query, load, lat]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (loc.source === 'gps') await loc.locate();
    await load(query);
    setRefreshing(false);
  };

  const chooseLocation = () => navigation.navigate('Addresses', { selectMode: true });
  const radiusKm = result?.radius_km ?? config.delivery_radius_km;

  const renderBody = () => {
    if (!loc.coords && (loc.status === 'idle' || loc.status === 'locating')) {
      return <Loader text="Finding restaurants near you…" />;
    }
    if (!loc.coords) {
      const denied = loc.status === 'denied';
      return (
        <EmptyState emoji="📍" title={denied ? 'Allow location access' : "Couldn't find your location"}
          subtitle={denied
            ? 'We use your location to show restaurants that deliver to you.'
            : 'Turn on location (GPS) on your phone and try again.'}
          action={
            <View style={{ width: '100%' }}>
              <Button title={denied ? 'Open settings' : 'Try again'} onPress={denied ? () => Linking.openSettings() : loc.locate} />
              <Button title="Choose a saved address" variant="outline" onPress={chooseLocation} style={{ marginTop: 10 }} />
            </View>
          } />
      );
    }
    if (!result && !error) return <Loader text="Finding restaurants near you…" />;

    return (
      <FlatList
        data={result?.restaurants || []}
        keyExtractor={(r) => String(r.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: cart.count ? 100 : 24, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <>
            {!config.orders_open && <Banner text={config.closed_message || `We take orders from ${config.order_window_text}.`} style={{ marginBottom: 14 }} />}
            {error && result ? <Banner tone="error" text={error} style={{ marginBottom: 14 }} /> : null}
            {result?.restaurants?.length ? (
              <Text style={s.section} accessibilityRole="header">
                {result.restaurants.length} restaurant{result.restaurants.length > 1 ? 's' : ''} within {radiusKm} km
              </Text>
            ) : null}
          </>
        }
        ListEmptyComponent={
          error && !result ? (
            <EmptyState emoji="📡" title="Couldn't load restaurants" subtitle={error}
              action={<Button title="Try again" variant="outline" onPress={() => load(query)} />} />
          ) : query ? (
            <EmptyState emoji="🔍" title="No matches nearby" subtitle="Try a different dish or cuisine." />
          ) : (
            <EmptyState emoji="🛵" title={`No restaurants within ${radiusKm} km`}
              subtitle="We're not delivering here yet. Try a different address."
              action={<Button title="Change location" variant="outline" onPress={chooseLocation} />} />
          )
        }
        renderItem={({ item: r }) => (
          <Pressable onPress={() => navigation.navigate('Restaurant', { id: r.id })} style={s.card}
            accessibilityRole="button"
            accessibilityLabel={`${r.name}, ${r.cuisine}, ${r.distance_km} kilometres away${r.is_open ? '' : ', closed now'}`}>
            <View>
              <FoodArt restaurant={r} height={160} style={{ borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg }} />
              {!r.is_open && <View style={s.closed}><Text style={s.closedText}>Closed now</Text></View>}
            </View>
            <View style={{ padding: 14 }}>
              <View style={s.rowBetween}>
                <Text style={s.name} numberOfLines={1}>{r.name}</Text>
                <RatingPill rating={r.rating} />
              </View>
              <Text style={s.meta}>{r.cuisine}</Text>
              <Text style={s.meta}>
                {r.delivery_time_min}–{r.delivery_time_min + 10} min  |  {r.distance_km} km  |  {rupee(r.cost_for_two)} for two
              </Text>
            </View>
          </Pressable>
        )}
      />
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={['top']} style={s.header}>
        <Pressable onPress={chooseLocation} style={s.addressRow} accessibilityRole="button"
          accessibilityLabel={`Delivering to ${loc.label || 'your location'}. Change location`}>
          <Ionicons name={loc.source === 'address' ? 'home' : 'navigate'} size={20} color={colors.ink} />
          <View style={{ marginLeft: 8, flex: 1 }}>
            <Text style={s.addrLabel} numberOfLines={1}>
              {loc.label || (loc.status === 'locating' ? 'Locating…' : 'Set location')} <Ionicons name="chevron-down" size={14} />
            </Text>
            <Text style={s.addrLine} numberOfLines={1}>{loc.subtitle || 'Tap to choose where we deliver'}</Text>
          </View>
        </Pressable>
        <Text style={s.greeting}>Hungry, {user?.name?.split(' ')[0]}?</Text>
        <View style={s.search}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Search for restaurants or dishes"
            placeholderTextColor={colors.muted} style={s.searchInput} returnKeyType="search"
            accessibilityLabel="Search restaurants or dishes" />
        </View>
      </SafeAreaView>

      {renderBody()}

      {cart.count > 0 && <CartBar count={cart.count} amount={rupee(cart.subtotal)} onPress={() => navigation.navigate('Cart')} />}
    </View>
  );
}

const s = StyleSheet.create({
  header: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingBottom: 16, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  addressRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 8 },
  addrLabel: { fontWeight: '900', fontSize: 16, color: colors.ink },
  addrLine: { color: colors.ink, opacity: 0.7, fontSize: 13 },
  greeting: { fontSize: 28, fontWeight: '900', color: colors.ink, marginTop: 16, marginBottom: 12, letterSpacing: -0.5 },
  search: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: radius.md, paddingHorizontal: 14, height: 48 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: colors.text },
  section: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: radius.lg, marginBottom: 18, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  closed: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.65)', alignItems: 'center', justifyContent: 'center' },
  closedText: { fontWeight: '800', backgroundColor: colors.ink, color: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, overflow: 'hidden' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 18, fontWeight: '800', color: colors.text, flex: 1, marginRight: 8 },
  meta: { color: colors.muted, marginTop: 4, fontSize: 13 },
});
