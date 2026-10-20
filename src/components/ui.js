import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, statusMeta } from '../theme';

export function Button({ title, onPress, variant = 'primary', loading, disabled, style, small, icon, accessibilityLabel }) {
  const v = variants[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={({ pressed }) => [
        s.btn, small && s.btnSmall, { backgroundColor: v.bg, borderColor: v.border },
        inactive && { opacity: 0.5 }, pressed && { opacity: 0.85 }, style,
      ]}
    >
      {loading ? <ActivityIndicator color={v.fg} /> : (
        <View style={s.row}>
          {icon}
          <Text style={[s.btnText, small && { fontSize: 13 }, { color: v.fg }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const variants = {
  primary: { bg: colors.primary, fg: colors.ink, border: colors.primary },
  dark:    { bg: colors.ink, fg: colors.primary, border: colors.ink },
  outline: { bg: 'transparent', fg: colors.text, border: colors.border },
  danger:  { bg: 'transparent', fg: colors.danger, border: '#F1C9C6' },
  success: { bg: colors.success, fg: '#fff', border: colors.success },
};

export function Input({ label, style, inputStyle, ...props }) {
  return (
    <View style={[{ marginBottom: 14 }, style]}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <TextInput placeholderTextColor="#A8A190" accessibilityLabel={label} style={[s.input, inputStyle]} {...props} />
    </View>
  );
}

export function Card({ children, style }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function StatusBadge({ status }) {
  const m = statusMeta[status] || statusMeta.placed;
  return (
    <View style={[s.badge, { backgroundColor: m.bg }]} accessibilityLabel={`Status: ${m.label}`}>
      <Text style={[s.badgeText, { color: m.color }]}>{m.label}</Text>
    </View>
  );
}

export function VegDot({ veg }) {
  const c = veg ? colors.veg : colors.nonveg;
  return (
    <View style={[s.vegBox, { borderColor: c }]} accessibilityLabel={veg ? 'Vegetarian' : 'Non-vegetarian'}>
      <View style={[s.vegDot, { backgroundColor: c }]} />
    </View>
  );
}

export function Checkbox({ checked, onChange, children, style }) {
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={[s.row, { alignItems: 'flex-start' }, style]}
      hitSlop={6}
    >
      <View style={[s.check, checked && s.checkOn]}>
        {checked && <Ionicons name="checkmark" size={16} color={colors.ink} />}
      </View>
      <View style={{ flex: 1, marginLeft: 10 }}>{children}</View>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress, style }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: !!selected }}
      style={[s.chip, selected && s.chipOn, style]}
    >
      <Text style={s.chipText}>{label}</Text>
    </Pressable>
  );
}

export function Loader({ text }) {
  return (
    <View style={s.center}>
      <ActivityIndicator size="large" color={colors.primaryDark} />
      {text ? <Text style={s.loaderText}>{text}</Text> : null}
    </View>
  );
}

export function EmptyState({ emoji = '🍽️', title, subtitle, action }) {
  return (
    <View style={[s.center, { padding: 32 }]}>
      <Text style={{ fontSize: 52, marginBottom: 12 }} accessibilityElementsHidden importantForAccessibility="no">{emoji}</Text>
      <Text style={s.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={s.emptySub}>{subtitle}</Text> : null}
      {action}
    </View>
  );
}

export function Banner({ text, tone = 'warning', style }) {
  const t = tone === 'error' ? { bg: '#FBE7E5', fg: colors.danger } : { bg: colors.primarySoft, fg: '#7A5B00' };
  return (
    <View style={[s.banner, { backgroundColor: t.bg }, style]} accessibilityRole="alert">
      <Ionicons name={tone === 'error' ? 'alert-circle' : 'time-outline'} size={18} color={t.fg} />
      <Text style={[s.bannerText, { color: t.fg }]}>{text}</Text>
    </View>
  );
}

export function Row({ children, style }) {
  return <View style={[s.row, style]}>{children}</View>;
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  btn: { height: 50, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, borderWidth: 1.5 },
  btnSmall: { height: 36, paddingHorizontal: 14, borderRadius: radius.sm },
  btnText: { fontSize: 15, fontWeight: '700', letterSpacing: 0.2, marginLeft: 4 },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, height: 50, fontSize: 15, color: colors.text, backgroundColor: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.border },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  vegBox: { width: 14, height: 14, borderWidth: 1.5, borderRadius: 3, alignItems: 'center', justifyContent: 'center' },
  vegDot: { width: 6, height: 6, borderRadius: 3 },
  check: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', marginTop: 1 },
  checkOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.border, marginRight: 8, marginBottom: 8, backgroundColor: '#fff' },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontWeight: '700', color: colors.ink },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loaderText: { marginTop: 12, color: colors.muted, fontWeight: '600' },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center' },
  emptySub: { fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 6, marginBottom: 16, lineHeight: 20 },
  banner: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: radius.md },
  bannerText: { flex: 1, marginLeft: 8, fontWeight: '600', lineHeight: 19 },
});
