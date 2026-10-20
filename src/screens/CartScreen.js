import React, { useCallback, useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api, { errorMessage } from '../api';
import { useCart } from '../CartContext';
import { useAppConfig } from '../AppConfigContext';
import { useLocation } from '../LocationContext';
import { distanceKm } from '../geo';
import { colors, radius, rupee } from '../theme';
import { Banner, Button, Card, EmptyState, VegDot } from '../components/ui';
import { QtyStepper } from '../components/food';

const NEARBY_KM = 0.5; // a saved address this close to the GPS location is pre-selected

export default function CartScreen({ navigation }) {
  const cart = useCart();
  const { config, refresh: refreshConfig } = useAppConfig();
  const loc = useLocation();
  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState(null);
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);

  // Default address: the one chosen on Home; otherwise a saved address right where the user is
  const preferredId = useCallback((list) => {
    if (loc.addressId && list.some((a) => a.id === loc.addressId)) return loc.addressId;
    if (loc.source === 'gps' && loc.coords) {
      const near = list
        .filter((a) => a.lat != null && a.lng != null)
        .map((a) => ({ a, d: distanceKm(loc.coords, { lat: Number(a.lat), lng: Number(a.lng) }) }))
        .filter((x) => x.d <= NEARBY_KM)
        .sort((x, y) => x.d - y.d)[0];
      if (near) return near.a.id;
    }
    return null;
  }, [loc.addressId, loc.source, loc.coords]);

  useFocusEffect(useCallback(() => {
    refreshConfig();
    api.get('/addresses').then(({ data }) => {
      setAddresses(data);
      setAddressId((cur) => (data.some((a) => a.id === cur) ? cur : preferredId(data)));
    }).catch(() => {});
  }, [preferredId, refreshConfig]));

  // A newly added address becomes the delivery location; select it here too
  useEffect(() => { if (loc.addressId) setAddressId(loc.addressId); }, [loc.addressId]);

  if (!cart.count) {
    return <EmptyState emoji="🛒" title="Your cart is empty" subtitle="Add dishes from a restaurant to see them here."
      action={<Button title="Browse restaurants" onPress={() => navigation.navigate('Tabs', { screen: 'Home' })} />} />;
  }

  const ordersOpen = config.orders_open;

  const placeOrder = async () => {
    if (!addressId) return Alert.alert('Choose a delivery address', 'Select a saved address or add a new one.');
    setPlacing(true);
    try {
      const { data } = await api.post('/orders', {
        restaurant_id: cart.restaurant.id,
        address_id: addressId,
        notes: notes.trim() || null,
        items: cart.lines.map((l) => ({ menu_item_id: l.item.id, quantity: l.qty })),
      });
      cart.clear();
      navigation.replace('OrderTracking', { id: data.id });
    } catch (e) {
      Alert.alert("Couldn't place order", errorMessage(e));
      refreshConfig();
      setPlacing(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.surface }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        <Card>
          <Text style={s.restaurant} accessibilityRole="header">{cart.restaurant.name}</Text>
          {cart.lines.map(({ item, qty }) => (
            <View key={item.id} style={s.line}>
              <VegDot veg={item.is_veg} />
              <View style={{ flex: 1, marginHorizontal: 10 }}>
                <Text style={s.itemName}>{item.name}</Text>
                <Text style={s.muted}>{rupee(item.price)}</Text>
              </View>
              <QtyStepper qty={qty} itemName={item.name}
                onAdd={() => cart.add(cart.restaurant, item)} onRemove={() => cart.remove(item.id)} />
              <Text style={s.lineTotal}>{rupee(item.price * qty)}</Text>
            </View>
          ))}
          <TextInput value={notes} onChangeText={setNotes} placeholder="Add cooking instructions (optional)"
            placeholderTextColor={colors.muted} style={s.notes} multiline maxLength={500}
            accessibilityLabel="Cooking instructions" />
        </Card>

        <Card style={{ marginTop: 14 }}>
          <View style={s.rowBetween}>
            <Text style={s.cardTitle}>Deliver to</Text>
            <Pressable onPress={() => navigation.navigate('AddAddress')} accessibilityRole="button" hitSlop={8}>
              <Text style={s.link}>Add new</Text>
            </Pressable>
          </View>
          {addresses.length === 0 && <Text style={[s.muted, { marginTop: 8 }]}>No saved address yet. Add one to place your order.</Text>}
          {addresses.length > 0 && !addressId && <Text style={[s.muted, { marginTop: 8 }]}>Select where we should deliver.</Text>}
          {addresses.map((a) => {
            const on = addressId === a.id;
            return (
              <Pressable key={a.id} onPress={() => setAddressId(a.id)} style={[s.addr, on && s.addrOn]}
                accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={`${a.label}: ${a.house || ''} ${a.line1}`}>
                <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={20} color={colors.primaryDark} />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={s.itemName}>{a.label}</Text>
                  <Text style={s.muted} numberOfLines={2}>{[a.house, a.line1].filter(Boolean).join(', ')}</Text>
                </View>
              </Pressable>
            );
          })}
        </Card>

        <Card style={{ marginTop: 14 }}>
          <Text style={s.cardTitle}>Bill details</Text>
          <Bill label="Item total" value={cart.subtotal} />
          <Bill label="Delivery fee" value={cart.fee} />
          <Bill label={`Taxes (${Math.round(cart.taxRate * 1000) / 10}%)`} value={cart.taxes} />
          <View style={s.divider} />
          <Bill label="To pay" value={cart.total} bold />
        </Card>

        <Card style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="cash-outline" size={22} color={colors.success} />
          <Text style={[s.itemName, { marginLeft: 10 }]}>Cash on delivery</Text>
        </Card>
      </ScrollView>

      {/* In the normal layout flow (not floating), so the keyboard never covers the notes box */}
      <SafeAreaView edges={['bottom']} style={s.footer}>
        {!ordersOpen && <Banner text={config.closed_message || `We take orders from ${config.order_window_text}.`} style={{ marginBottom: 10 }} />}
        <Button title={`Place order  |  ${rupee(cart.total)}`} onPress={placeOrder} loading={placing}
          disabled={!ordersOpen || !addressId} />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function Bill({ label, value, bold }) {
  return (
    <View style={[s.rowBetween, { marginTop: 8 }]}>
      <Text style={bold ? s.billBold : s.muted}>{label}</Text>
      <Text style={bold ? s.billBold : s.billVal}>{rupee(value)}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  restaurant: { fontSize: 18, fontWeight: '900', color: colors.text, marginBottom: 6 },
  line: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  itemName: { fontSize: 15, fontWeight: '700', color: colors.text },
  muted: { color: colors.muted, fontSize: 13, marginTop: 2 },
  lineTotal: { width: 64, textAlign: 'right', fontWeight: '700', color: colors.text },
  notes: { marginTop: 10, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: 12, minHeight: 44, color: colors.text, textAlignVertical: 'top' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  link: { color: colors.primaryDark, fontWeight: '800' },
  addr: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, marginTop: 10 },
  addrOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  divider: { height: 1, backgroundColor: colors.border, marginTop: 12 },
  billVal: { color: colors.text, fontWeight: '600' },
  billBold: { fontSize: 16, fontWeight: '900', color: colors.text },
  footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.border },
});
