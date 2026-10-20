import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { TOKEN_KEY, isUnauthorized, setUnauthorizedHandler } from './api';
import { ROLE } from './config';

const USER_KEY = 'cached_user';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const saveUser = useCallback(async (u) => {
    setUser(u);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
  }, []);

  const clearSession = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  // Expired or revoked token anywhere in the app -> back to login
  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  useEffect(() => {
    (async () => {
      try {
        if (!(await SecureStore.getItemAsync(TOKEN_KEY))) return;

        // Show the app straight away with the saved profile, then refresh it in the background
        const cached = await AsyncStorage.getItem(USER_KEY);
        if (cached) setUser(JSON.parse(cached));

        try {
          const { data } = await api.get('/auth/me');
          if (data.role === ROLE) await saveUser(data);
          else await clearSession();
        } catch (e) {
          // Only a rejected token logs the user out. No internet / server down keeps them signed in.
          if (isUnauthorized(e)) await clearSession();
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [clearSession, saveUser]);

  const sendOtp = async (phone) => (await api.post('/auth/otp/send', { phone })).data;

  const verifyOtp = async (phone, otp) => {
    const { data } = await api.post('/auth/otp/verify', { phone, otp });
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    await saveUser(data.user);
    return data;
  };

  const completeRegistration = async ({ name, lat, lng }) => {
    const { data } = await api.post('/auth/complete-registration', { name, lat, lng, accept_terms: true });
    await saveUser(data);
  };

  const updateProfile = async (payload) => {
    const { data } = await api.put('/profile', payload);
    await saveUser(data);
    return data;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    await clearSession();
  };

  return (
    <AuthContext.Provider value={{ user, loading, sendOtp, verifyOtp, completeRegistration, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
