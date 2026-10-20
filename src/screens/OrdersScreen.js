import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api, { errorMessage } from '../api';
import { usePolling } from '../usePolling';
import { colors, radius, rupee, timeAgo } from '../theme';
import { Banner, Button, EmptyState, Loader, StatusBadge } from '../components/ui';

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => api.get('/orders')
    .then(({ data }) => { setOrders(data); setError(null); })
    .catch((e) => setError(errorMessage(e))), []);
  usePolling(load, 10000);

  // Swipe down to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const renderBody = () => {
    if (orders === null && !error) return <Loader />;
    if (orders === null && error) {
      return <EmptyState emoji="📡" title="Couldn't load your orders" subtitle={error}
        action={<Button title="Try again" variant="outline" onPress={load} />} />;
    }
    return (
      <FlatList
        data={orders}
        keyExtractor={(o) => String(o.id)}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            colors={[colors.primaryDark]} tintColor={colors.primaryDark} />
        }
        ListHeaderComponent={error ? <Banner tone="error" text={`Showing your last loaded orders. ${error}`} style={{ marginBottom: 12 }} /> : null}
        ListEmptyComponent={<EmptyState emoji="🧾" title="No orders yet" subtitle="Your past and current orders will show up here." />}
        renderItem={({ item: o }) => (
          <Pressable style={s.card} onPress={() => navigation.navigate('OrderTracking', { id: o.id })}
            accessibilityRole="button" accessibilityLabel={`Order from ${o.restaurant?.name}, ${rupee(o.total)}`}>
            <View style={s.rowBetween}>
              <Text style={s.name}>{o.restaurant?.name}</Text>
              <StatusBadge status={o.status} />
            </View>
            <Text style={s.items} numberOfLines={2}>{o.items.map((i) => `${i.quantity} × ${i.name}`).join(', ')}</Text>
            <View style={[s.rowBetween, { marginTop: 10 }]}>
              <Text style={s.muted}>#{o.code}  |  {timeAgo(o.created_at)}</Text>
              <Text style={s.total}>{rupee(o.total)}</Text>
            </View>
          </Pressable>
        )}
      />
    );
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.surface }}>
      <Text style={s.title} accessibilityRole="header">Your orders</Text>
      {renderBody()}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '900', color: colors.text, paddingHorizontal: 16, paddingTop: 12 },
  card: { backgroundColor: '#fff', borderRadius: radius.lg, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '800', color: colors.text, flex: 1, marginRight: 8 },
  items: { color: colors.text, marginTop: 8, lineHeight: 20 },
  muted: { color: colors.muted, fontSize: 12 },
  total: { fontWeight: '800', color: colors.text },
});