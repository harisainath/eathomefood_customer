import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import api from '../api';
import { useAppConfig } from '../AppConfigContext';
import { distanceKm } from '../geo';
import { colors, radius } from '../theme';

/** Live map of the rider's position, refreshed every customer_tracking_interval_sec (backend setting). */
export default function LiveTrackingMap({ orderId, status }) {
  const { config } = useAppConfig();
  const [data, setData] = useState(null);
  const map = useRef(null);
  const interval = (config.customer_tracking_interval_sec || 10) * 1000;

  const load = useCallback(() => api.get(`/orders/${orderId}/tracking`).then(({ data: d }) => setData(d)).catch(() => {}), [orderId]);
  useEffect(() => {
    load();
    const id = setInterval(load, interval);
    return () => clearInterval(id);
  }, [load, interval]);

  const rider = data?.rider;
  const pickedUp = status === 'picked_up';
  const target = data ? (pickedUp ? data.destination : data.restaurant) : null;
  const points = [rider, target].filter((p) => p?.lat != null).map((p) => ({ latitude: Number(p.lat), longitude: Number(p.lng) }));

  useEffect(() => {
    if (points.length > 1) map.current?.fitToCoordinates(points, { edgePadding: { top: 60, right: 60, bottom: 60, left: 60 }, animated: true });
  }, [rider?.lat, rider?.lng, target?.lat]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!data || !rider) return null; // no rider assigned yet

  const km = target?.lat != null ? distanceKm({ lat: rider.lat, lng: rider.lng }, { lat: target.lat, lng: target.lng }) : null;
  const ago = rider.updated_at ? Math.max(0, Math.round((Date.now() - new Date(rider.updated_at).getTime()) / 1000)) : null;

  return (
    <View style={s.card}>
      <View style={s.mapWrap}>
        <MapView ref={map} provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined} style={StyleSheet.absoluteFill} toolbarEnabled={false}
          initialRegion={{ ...points[0], latitudeDelta: 0.03, longitudeDelta: 0.03 }}>
          <Marker coordinate={{ latitude: Number(rider.lat), longitude: Number(rider.lng) }} title={rider.name} description={rider.vehicle}>
            <View style={s.riderPin}><Text style={s.pinText}>🛵</Text></View>
          </Marker>
          {target?.lat != null && (
            <Marker coordinate={{ latitude: Number(target.lat), longitude: Number(target.lng) }} title={pickedUp ? 'Your address' : data.restaurant.name}>
              <View style={s.pin}><Text style={s.pinText}>{pickedUp ? '🏠' : '🍽️'}</Text></View>
            </Marker>
          )}
        </MapView>
      </View>
      <Text style={s.line}>
        {pickedUp ? `${rider.name} is on the way` : `${rider.name} is heading to the restaurant`}
        {km != null ? `  |  ${km.toFixed(1)} km away` : ''}
      </Text>
      <Text style={[s.sub, rider.stale && { color: colors.danger }]}>
        {rider.stale ? 'Location not updated recently' : ago != null ? `Updated ${ago < 60 ? `${ago}s` : `${Math.round(ago / 60)} min`} ago` : ''}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: radius.lg, padding: 12, marginTop: 14, borderWidth: 1, borderColor: colors.border },
  mapWrap: { height: 230, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.surface },
  riderPin: { backgroundColor: colors.primary, borderRadius: 22, padding: 6, borderWidth: 2, borderColor: '#fff' },
  pin: { backgroundColor: '#fff', borderRadius: 20, padding: 5, borderWidth: 2, borderColor: colors.primary },
  pinText: { fontSize: 20 },
  line: { fontWeight: '800', color: colors.text, marginTop: 10 },
  sub: { color: colors.muted, marginTop: 2, fontSize: 12 },
});
