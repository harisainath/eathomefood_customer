import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from './config';

export const TOKEN_KEY = 'auth_token';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// When the server says the token is no longer valid, AuthContext logs the user out.
let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const sentToken = !!error?.config?.headers?.Authorization;
    const isLogout = error?.config?.url?.includes('/auth/logout');
    if (error?.response?.status === 401 && sentToken && !isLogout && onUnauthorized) onUnauthorized();
    return Promise.reject(error);
  }
);

export const isUnauthorized = (e) => e?.response?.status === 401;

/** Turn a Laravel error response into one readable sentence. */
export function errorMessage(e) {
  const data = e?.response?.data;
  if (data?.errors) return Object.values(data.errors).flat()[0];
  if (data?.message) return data.message;
  if (e?.message === 'Network Error' || e?.code === 'ECONNABORTED') {
    return "Can't reach the server. Check your internet connection and try again.";
  }
  return e?.message || 'Something went wrong.';
}

export default api;
