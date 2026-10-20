import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { useAppConfig } from './AppConfigContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const { config } = useAppConfig();
  const [restaurant, setRestaurant] = useState(null);
  const [lines, setLines] = useState({}); // { [itemId]: { item, qty } }
  const [hydrated, setHydrated] = useState(false);
  const storageKey = user ? `cart:${user.id}` : null;

  // Restore the saved cart for this user (survives closing the app)
  useEffect(() => {
    setHydrated(false);
    setRestaurant(null);
    setLines({});
    if (!storageKey) return;
    AsyncStorage.getItem(storageKey)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw);
        setRestaurant(saved.restaurant || null);
        setLines(saved.lines || {});
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated || !storageKey) return;
    AsyncStorage.setItem(storageKey, JSON.stringify({ restaurant, lines })).catch(() => {});
  }, [restaurant, lines, hydrated, storageKey]);

  const doAdd = (r, item) => {
    setRestaurant({ id: r.id, name: r.name });
    setLines((l) => ({ ...l, [item.id]: { item, qty: (l[item.id]?.qty || 0) + 1 } }));
  };

  const add = (r, item) => {
    if (restaurant && restaurant.id !== r.id && Object.keys(lines).length) {
      Alert.alert('Start a new cart?', `Your cart has items from ${restaurant.name}. Adding this will clear it.`, [
        { text: 'Keep cart', style: 'cancel' },
        { text: 'Start new', style: 'destructive', onPress: () => { setLines({}); doAdd(r, item); } },
      ]);
      return;
    }
    doAdd(r, item);
  };

  const remove = (itemId) =>
    setLines((l) => {
      const qty = (l[itemId]?.qty || 0) - 1;
      const next = { ...l };
      if (qty <= 0) delete next[itemId];
      else next[itemId] = { ...l[itemId], qty };
      if (!Object.keys(next).length) setRestaurant(null);
      return next;
    });

  const clear = () => { setLines({}); setRestaurant(null); };

  // Fee and tax come from the server, so the preview always matches the final bill
  const totals = useMemo(() => {
    const list = Object.values(lines);
    const count = list.reduce((n, l) => n + l.qty, 0);
    const subtotal = list.reduce((n, l) => n + Number(l.item.price) * l.qty, 0);
    const taxRate = Number(config.tax_rate) || 0;
    const taxes = Math.round(subtotal * taxRate * 100) / 100;
    const fee = count ? Number(config.delivery_fee) || 0 : 0;
    return { count, subtotal, taxes, taxRate, fee, total: subtotal + taxes + fee };
  }, [lines, config.tax_rate, config.delivery_fee]);

  const qtyOf = (id) => lines[id]?.qty || 0;

  return (
    <CartContext.Provider value={{ restaurant, lines: Object.values(lines), add, remove, clear, qtyOf, ...totals }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
