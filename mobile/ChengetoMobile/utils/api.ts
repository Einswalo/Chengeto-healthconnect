import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:8000'; // Use your computer's IP address for physical device

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to add token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      console.log('🔑 TOKEN FOUND:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.log('⚠️ No token found in storage');
      }
    } catch (error) {
      console.log('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.log('🔒 Unauthorized - clearing token');
      await AsyncStorage.removeItem('auth_token');
      // Navigate to login if needed - handle in component
    }
    return Promise.reject(error);
  }
);

export default api;

export const loginUser = async (email: string, password: string) => {
  try {
    const response = await api.post("/auth/patient-login", {
      email,
      password,
    });
    
    console.log('✅ Login response:', response.data);
    return response.data;
  } catch (error: any) {
    console.log('❌ Login error:', error?.response?.data || error.message);
    throw error;
  }
};

export const getToken = async () => {
  return await AsyncStorage.getItem('auth_token');
};

export const saveToken = async (token: string) => {
  console.log('💾 Saving token:', token.substring(0, 30) + '...');
  await AsyncStorage.setItem('auth_token', token);
};

export const removeToken = async () => {
  console.log('🗑️ Removing token');
  await AsyncStorage.removeItem('auth_token');
};