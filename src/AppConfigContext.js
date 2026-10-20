import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import api from './api';

// Fallbacks used only until the server responds. The real values come from the backend
// (app_settings table), so radius, order hours and fees change without an app release.
const DEFAULTS = {
  delivery_radius_km: 5,
  order_window_text: '6:00 AM to 11:59 PM',
  orders_open: true,
  closed_message: null,
  delivery_fee: 30,
  tax_rate: 0.05,
  terms_url: null,
};

const AppConfigContext = createContext({ config: DEFAULTS, refresh: () => {} });

export function AppConfigProvider({ children }) {
  const [config, setConfig] = useState(DEFAULTS);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get('/config');
      setConfig((c) => ({ ...c, ...data }));
    } catch {
      // keep the last known values
    }
  }, []);

  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    const id = setInterval(refresh, 60000); // keeps "orders open" accurate around opening/closing time
    return () => { sub.remove(); clearInterval(id); };
  }, [refresh]);

  return <AppConfigContext.Provider value={{ config, refresh }}>{children}</AppConfigContext.Provider>;
}

export const useAppConfig = () => useContext(AppConfigContext);
