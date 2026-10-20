import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';

const tints = ['#FFE8A3', '#FFD6B0', '#D9F0C8', '#FCD5DC', '#D6E6FF', '#EADCFB'];
const emojiFor = (cuisine = '') => {
  const c = cuisine.toLowerCase();
  if (c.includes('biryani')) return '🍛';
  if (c.includes('pizza')) return '🍕';
  if (c.includes('burger')) return '🍔';
  if (c.includes('south')) return '🥞';
  if (c.includes('chinese')) return '🥡';
  if (c.includes('dessert') || c.includes('cake') || c.includes('bakery')) return '🍰';
  return '🍲';
};

/** Restaurant photo (image_url) with a coloured placeholder when there's no photo yet. */
export function FoodArt({ restaurant, height = 150, style }) {
  if (restaurant.image_url) {
    return (
      <Image source={{ uri: restaurant.image_url }} style={[{ height, width: '100%', backgroundColor: colors.surface }, style]}
        resizeMode="cover" accessibilityLabel={`${restaurant.name} photo`} />
    );
  }
  return (
    <View style={[{ height, backgroundColor: tints[restaurant.id % tints.length], alignItems: 'center', justifyContent: 'center' }, style]}
      accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Text style={{ fontSize: height * 0.4 }}>{emojiFor(restaurant.cuisine)}</Text>
    </View>
  );
}

export function ItemPhoto({ item }) {
  if (!item.image_url) return null;
  return <Image source={{ uri: item.image_url }} style={s.itemPhoto} accessibilityLabel={`${item.name} photo`} />;
}

export function RatingPill({ rating }) {
  return (
    <View style={s.rating} accessibilityLabel={`Rated ${Number(rating).toFixed(1)} out of 5`}>
      <Text style={s.ratingText}>★ {Number(rating).toFixed(1)}</Text>
    </View>
  );
}

/** ADD button that turns into a − qty + stepper. */
export function QtyStepper({ qty, onAdd, onRemove, disabled, itemName = 'item' }) {
  if (!qty) {
    return (
      <Pressable onPress={onAdd} disabled={disabled} style={[s.add, disabled && { opacity: 0.4 }]}
        accessibilityRole="button" accessibilityLabel={`Add ${itemName} to cart`} accessibilityState={{ disabled: !!disabled }}>
        <Text style={s.addText}>ADD</Text>
      </Pressable>
    );
  }
  return (
    <View style={[s.add, s.stepper]}>
      <Pressable onPress={onRemove} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Remove one ${itemName}`}>
        <Text style={s.stepText}>−</Text>
      </Pressable>
      <Text style={s.qty} accessibilityLabel={`${qty} ${itemName} in cart`}>{qty}</Text>
      <Pressable onPress={onAdd} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Add one more ${itemName}`}>
        <Text style={s.stepText}>+</Text>
      </Pressable>
    </View>
  );
}

/** Sticky bar at the bottom showing cart count and total. */
export function CartBar({ count, amount, onPress }) {
  return (
    <Pressable style={s.cartBar} onPress={onPress} accessibilityRole="button"
      accessibilityLabel={`View cart, ${count} item${count > 1 ? 's' : ''}, ${amount}`}>
      <Text style={s.cartText}>{count} item{count > 1 ? 's' : ''}  |  {amount}</Text>
      <Text style={s.cartText}>View cart</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  rating: { backgroundColor: colors.success, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  ratingText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  itemPhoto: { width: 92, height: 80, borderRadius: radius.sm, marginBottom: 8, backgroundColor: colors.surface },
  add: { width: 92, height: 36, borderRadius: radius.sm, borderWidth: 1.5, borderColor: colors.primaryDark, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  addText: { color: colors.ink, fontWeight: '900', letterSpacing: 0.5 },
  stepper: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, backgroundColor: colors.primary },
  stepText: { fontSize: 20, fontWeight: '800', color: colors.ink },
  qty: { fontWeight: '900', color: colors.ink, fontSize: 15 },
  cartBar: { position: 'absolute', left: 16, right: 16, bottom: 16, height: 56, backgroundColor: colors.ink, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18 },
  cartText: { color: colors.primary, fontWeight: '800', fontSize: 15 },
});
