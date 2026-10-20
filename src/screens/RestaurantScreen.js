import React, { useEffect, useState } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import api, { errorMessage } from '../api';
import { useCart } from '../CartContext';
import { useAppConfig } from '../AppConfigContext';
import { colors, radius, rupee } from '../theme';
import { Banner, Button, EmptyState, Loader, VegDot } from '../components/ui';
import { CartBar, ItemPhoto, QtyStepper, RatingPill } from '../components/food';

export default function RestaurantScreen({ route, navigation }) {
  const { id } = route.params;
  const cart = useCart();
  const { config } = useAppConfig();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [vegOnly, setVegOnly] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setError(null);
    api.get(`/restaurants/${id}`)
      .then(({ data }) => { setData(data); navigation.setOptions({ title: data.name }); })
      .catch((e) => setError(errorMessage(e)));
  }, [id, navigation, attempt]);

  if (error) {
    return <EmptyState emoji="📡" title="Couldn't load the menu" subtitle={error}
      action={<Button title="Try again" variant="outline" onPress={() => setAttempt((a) => a + 1)} />} />;
  }
  if (!data) return <Loader />;

  const restaurant = { id: data.id, name: data.name };
  const sections = data.categories
    .map((c) => ({ title: c.name, data: c.items.filter((i) => !vegOnly || i.is_veg) }))
    .filter((sct) => sct.data.length);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SectionList
        sections={sections}
        keyExtractor={(i) => String(i.id)}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: cart.count ? 100 : 24 }}
        ListHeaderComponent={
          <View style={s.info}>
            <View style={s.rowBetween}>
              <Text style={s.title} accessibilityRole="header">{data.name}</Text>
              <RatingPill rating={data.rating} />
            </View>
            <Text style={s.meta}>{data.cuisine}</Text>
            {data.address ? <Text style={s.meta}>{data.address}</Text> : null}
            <View style={s.divider} />
            <Text style={s.metaStrong}>{data.delivery_time_min}–{data.delivery_time_min + 10} min delivery  |  {rupee(data.cost_for_two)} for two</Text>
            {!data.is_open && <Text style={s.closed}>This restaurant is closed right now. You can browse the menu.</Text>}
            {data.is_open && !config.orders_open && (
              <Banner text={config.closed_message || `We take orders from ${config.order_window_text}.`} style={{ marginTop: 12 }} />
            )}
            <Pressable onPress={() => setVegOnly((v) => !v)} style={[s.vegToggle, vegOnly && s.vegToggleOn]}
              accessibilityRole="switch" accessibilityState={{ checked: vegOnly }} accessibilityLabel="Veg only">
              <VegDot veg />
              <Text style={s.vegText}>Veg only</Text>
            </Pressable>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <Text style={s.section} accessibilityRole="header">{section.title} ({section.data.length})</Text>
        )}
        renderItem={({ item }) => (
          <View style={s.item}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <VegDot veg={item.is_veg} />
              <Text style={s.itemName}>{item.name}</Text>
              <Text style={s.price}>{rupee(item.price)}</Text>
              {item.description ? <Text style={s.desc} numberOfLines={2}>{item.description}</Text> : null}
            </View>
            <View style={{ alignItems: 'center' }}>
              <ItemPhoto item={item} />
              <QtyStepper qty={cart.qtyOf(item.id)} disabled={!data.is_open} itemName={item.name}
                onAdd={() => cart.add(restaurant, item)} onRemove={() => cart.remove(item.id)} />
            </View>
          </View>
        )}
        ListEmptyComponent={<EmptyState emoji="🥗" title="No items to show" subtitle="Try turning off the veg filter." />}
      />

      {cart.count > 0 && cart.restaurant?.id === data.id && (
        <CartBar count={cart.count} amount={rupee(cart.subtotal)} onPress={() => navigation.navigate('Cart')} />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  info: { margin: 16, padding: 16, borderRadius: radius.lg, backgroundColor: colors.primarySoft },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '900', color: colors.text, flex: 1, marginRight: 8 },
  meta: { color: colors.muted, marginTop: 4 },
  metaStrong: { color: colors.text, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#F0E3B5', marginVertical: 12 },
  closed: { color: colors.danger, marginTop: 8, fontWeight: '600' },
  vegToggle: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginTop: 14, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill, borderWidth: 1.5, borderColor: '#E8D9A6', backgroundColor: '#fff' },
  vegToggleOn: { borderColor: colors.veg, backgroundColor: '#E8F6EC' },
  vegText: { marginLeft: 6, fontWeight: '700', color: colors.text },
  section: { fontSize: 18, fontWeight: '900', color: colors.text, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 6 },
  item: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemName: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 6 },
  price: { fontSize: 15, fontWeight: '600', color: colors.text, marginTop: 2 },
  desc: { color: colors.muted, marginTop: 4, fontSize: 13, lineHeight: 18 },
});
