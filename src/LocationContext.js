import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import api from './api';
import { useAuth } from './AuthContext';
import { getDeviceLocation } from './geo';

/**
 * The single "deliver to" location for the whole app (Home, Cart, new addresses).
 * On every launch it starts from the phone's current GPS location; the user can switch
 * to one of their saved addresses from the header on the Home screen.
 */
const LocationContext = createContext(null);

const EMPTY = { status: 'idle', coords: null, label: null, subtitle: null, source: null, addressId: null };

export function LocationProvider({ children }) {
  const { user } = useAuth();
  const [state, setState] = useState(EMPTY);
  const statusRef = useRef(state.status);
  statusRef.current = state.status;

  const locate = useCallback(async () => {
    setState((s) => ({ ...s, status: 'locating' }));
    try {
      const { coords, place } = await getDeviceLocation();
      setState({ status: 'ready', coords, label: place.label, subtitle: place.subtitle, source: 'gps', addressId: null });
      api.post('/me/location', coords).catch(() => {});
      return coords;
    } catch (e) {
      setState((s) => ({ ...s, status: e.code === 'denied' ? 'denied' : 'error' }));
      return null;
    }
  }, []);

  const selectAddress = useCallback((a) => {
    setState({
      status: 'ready',
      coords: { lat: Number(a.lat), lng: Number(a.lng) },
      label: a.label,
      subtitle: [a.house, a.line1].filter(Boolean).join(', '),
      source: 'address',
      addressId: a.id,
    });
  }, []);

  // Fresh GPS location every time the app starts (once the profile is complete)
  useEffect(() => {
    if (user?.profile_completed) locate();
    else setState(EMPTY);
  }, [user?.id, user?.profile_completed, locate]);

  // If the user went to Settings to allow location, try again when they come back
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active' && ['denied', 'error'].includes(statusRef.current) && user?.profile_completed) locate();
    });
    return () => sub.remove();
  }, [locate, user?.profile_completed]);

  return <LocationContext.Provider value={{ ...state, locate, selectAddress }}>{children}</LocationContext.Provider>;
}

export const useLocation = () => useContext(LocationContext);
