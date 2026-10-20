import React, { useCallback, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api, { errorMessage } from '../api';
import { usePolling } from '../usePolling';
import { colors, radius, rupee } from '../theme';
import { Button, Card, EmptyState, Loader, StatusBadge } from '../components/ui';
import LiveTrackingMap from '../components/LiveTrackingMap';

const FINAL_STATUSES = ['delivered', 'cancelled', 'rejected'];

const STEPS = [
  { key: 'placed', title: 'Order placed', sub: 'Waiting for the restaurant to confirm' },
  { key: 'preparing', title: 'Preparing your food', sub: 'The kitchen is on it' },
  { key: 'ready', title: 'Ready for pickup', sub: 'Packed and waiting for the rider' },
  { key: 'picked_up', title: 'On the way', sub: 'Your rider is heading to you' },
  { key: 'delivered', title: 'Delivered', sub: 'Enjoy your meal!' },
];

export default function OrderTrackingScreen({ route }) {
  const { id } = route.params;
  const [order, setOrder] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(() => api.get(`/orders/${id}`)
    .then(({ data }) => { setOrder(data); setError(null); })
    .catch((e) => setError(errorMessage(e))), [id]);

  // Stop asking the server once the order is finished
  usePolling(load, 5000, !order || !FINAL_STATUSES.includes(order.status));

  if (!order && error) {
    return <EmptyState emoji="📡" title="Couldn't load this order" subtitle={error}
      action={<Button title="Try again" variant="outline" onPress={load} />} />;
  }
  if (!order) return <Loader />;

  const stopped = ['cancelled', 'rejected'].includes(order.status);
  const current = STEPS.findIndex((st) => st.key === order.status);

  const cancel = () => Alert.alert('Cancel this order?', 'You can only cancel before the restaurant confirms.', [
    { text: 'Keep order', style: 'cancel' },
    { text: 'Cancel order', style: 'destructive', onPress: async () => {
      setCancelling(true);
      try { setOrder({ ...order, ...(await api.post(`/orders/${id}/cancel`)).data }); }
      catch (e) { Alert.alert("Couldn't cancel", errorMessage(e)); }
      finally { setCancelling(false); }
    } },
  ]);

  return (
    <ScrollView style={{ backgroundColor: colors.surface }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={s.hero}>
        <Text style={s.heroSmall}>{order.restaurant.name}  |  #{order.code}</Text>
        <Text style={s.heroBig}>
          {stopped ? (order.status === 'rejected' ? 'The restaurant could not take this order' : 'Order cancelled') : STEPS[current]?.title}
        </Text>
        {stopped && order.cancelled_by === 'restaurant' && order.cancel_reason ? (
          <Text style={s.heroNote}>Reason: {order.cancel_reason}</Text>
        ) : null}
        {order.status === 'preparing' && order.prep_time_min ? (
          <Text style={s.heroNote}>Ready in about {order.prep_time_min} minutes</Text>
        ) : null}
        <StatusBadge status={order.status} />
      </View>

      {/* Live rider location once a delivery partner is assigned */}
      {['preparing', 'ready', 'picked_up'].includes(order.status) && order.delivery_partner && (
        <LiveTrackingMap orderId={order.id} status={order.status} />
      )}

      {/* Code the customer gives the rider at the door */}
      {order.delivery_otp && ['preparing', 'ready', 'picked_up'].includes(order.status) && (
        <View style={s.otpCard} accessible accessibilityLabel={`Delivery code ${order.delivery_otp.split('').join(' ')}`}>
          <Text style={s.otpLabel}>Delivery code</Text>
          <Text style={s.otpValue}>{order.delivery_otp}</Text>
          <Text style={s.otpHint}>Share this code with your delivery partner only when you receive your order.</Text>
        </View>
      )}

      {!stopped && (
        <Card style={{ marginTop: 14 }}>
          {STEPS.map((st, i) => {
            const done = i <= current;
            return (
              <View key={st.key} style={s.step}>
                <View style={{ alignItems: 'center' }}>
                  <View style={[s.dot, done && s.dotDone]}>{done && <Ionicons name="checkmark" size={14} color={colors.ink} />}</View>
                  {i < STEPS.length - 1 && <View style={[s.line, i < current && s.lineDone]} />}
                </View>
                <View style={{ marginLeft: 12, flex: 1, paddingBottom: 18 }}>
                  <Text style={[s.stepTitle, !done && { color: colors.muted }]}>{st.title}</Text>
                  {i === current && <Text style={s.stepSub}>{st.sub}</Text>}
                </View>
              </View>
            );
          })}
        </Card>
      )}

      {order.delivery_partner && (
        <Card style={[s.rider, { marginTop: 14 }]}>
          <View style={s.avatar}><Ionicons name="bicycle" size={22} color={colors.ink} /></View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.stepTitle}>{order.delivery_partner.name}</Text>
            <Text style={s.stepSub}>Your delivery partner</Text>
          </View>
          <Button small variant="outline" title="Call" accessibilityLabel={`Call ${order.delivery_partner.name}`}
            onPress={() => Linking.openURL(`tel:${order.delivery_partner.phone}`)} />
        </Card>
      )}

      <Card style={{ marginTop: 14 }}>
        <Text style={s.cardTitle}>Order summary</Text>
        {order.items.map((i) => (
          <View key={i.id} style={s.row}>
            <Text style={s.text}>{i.quantity} × {i.name}</Text>
            <Text style={s.text}>{rupee(i.line_total)}</Text>
          </View>
        ))}
        <View style={s.divider} />
        <View style={s.row}><Text style={s.muted}>Delivery fee</Text><Text style={s.muted}>{rupee(order.delivery_fee)}</Text></View>
        <View style={s.row}><Text style={s.muted}>Taxes</Text><Text style={s.muted}>{rupee(order.taxes)}</Text></View>
        <View style={s.row}><Text style={s.total}>Total (cash on delivery)</Text><Text style={s.total}>{rupee(order.total)}</Text></View>
        <View style={s.divider} />
        <Text style={s.muted}>Delivering to {order.delivery_address}</Text>
      </Card>

      {order.status === 'placed' && (
        <Button title="Cancel order" variant="danger" onPress={cancel} loading={cancelling} style={{ marginTop: 16 }} />
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  hero: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: 20 },
  heroSmall: { color: colors.ink, opacity: 0.7, fontWeight: '600' },
  otpCard: { backgroundColor: colors.ink, borderRadius: radius.lg, padding: 16, marginTop: 14, alignItems: 'center' },
  otpLabel: { color: '#fff', opacity: 0.8, fontWeight: '700' },
  otpValue: { color: colors.primary, fontSize: 36, fontWeight: '900', letterSpacing: 10, marginVertical: 4 },
  otpHint: { color: '#fff', opacity: 0.75, fontSize: 12, textAlign: 'center' },
  heroNote: { color: colors.ink, fontWeight: '700', marginBottom: 10 },
  heroBig: { color: colors.ink, fontSize: 24, fontWeight: '900', marginVertical: 10, letterSpacing: -0.3 },
  step: { flexDirection: 'row' },
  dot: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.border, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  dotDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  line: { width: 2, flex: 1, backgroundColor: colors.border, minHeight: 18 },
  lineDone: { backgroundColor: colors.primary },
  stepTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  stepSub: { color: colors.muted, fontSize: 13, marginTop: 2 },
  rider: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  text: { color: colors.text },
  muted: { color: colors.muted, fontSize: 13 },
  total: { fontWeight: '900', color: colors.text },
  divider: { height: 1, backgroundColor: colors.border, marginTop: 12 },
});
