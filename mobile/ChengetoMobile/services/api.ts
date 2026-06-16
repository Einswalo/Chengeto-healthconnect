import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.24.175:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor - adds token to every request
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      console.log('🔑 Interceptor - Token found:', token ? 'Yes' : 'No');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('✅ Authorization header added');
      } else {
        console.log('⚠️ No token in storage');
      }
    } catch (error) {
      console.log('Error getting token in interceptor:', error);
    }
    return config;
  },
  (error) => {
    console.log('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handles auth errors
api.interceptors.response.use(
  (response) => {
    console.log(`📡 ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  async (error) => {
    console.log('❌ Response error:', error.response?.status, error.response?.data);
    
    if (error.response?.status === 401) {
      console.log('🔒 Unauthorized - clearing token');
      await AsyncStorage.removeItem('auth_token');
      // You can add navigation to login screen here if needed
    }
    return Promise.reject(error);
  }
);

// Login function
export const loginUser = async (email: string, password: string) => {
  console.log('🔐 Login attempt for:', email);
  try {
    const response = await api.post('/auth/login', {
      email,
      password,
    });
    
    console.log('✅ Login successful, token received');
    return response.data;
  } catch (error: any) {
    console.log('❌ Login failed:', error?.response?.data?.detail || error.message);
    throw error;
  }
};

// Patient login function
export const patientLogin = async (email: string, password: string) => {
  console.log('🔐 Patient login attempt for:', email);
  try {
    const response = await api.post('/auth/patient-login', {
      email,
      password,
    });
    
    console.log('✅ Patient login successful, token received');
    return response.data;
  } catch (error: any) {
    console.log('❌ Patient login failed:', error?.response?.data?.detail || error.message);
    throw error;
  }
};

// Token management functions
export const saveToken = async (token: string) => {
  try {
    console.log('💾 Saving token to AsyncStorage');
    await AsyncStorage.setItem('auth_token', token);
    console.log('✅ Token saved successfully');
  } catch (error) {
    console.error('Error saving token:', error);
  }
};

export const getToken = async () => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    console.log('🔑 Retrieved token:', token ? `${token.substring(0, 20)}...` : 'null');
    return token;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

export const removeToken = async () => {
  try {
    console.log('🗑️ Removing token from AsyncStorage');
    await AsyncStorage.removeItem('auth_token');
    console.log('✅ Token removed');
  } catch (error) {
    console.error('Error removing token:', error);
  }
};

// Check if user is authenticated
export const isAuthenticated = async () => {
  const token = await getToken();
  return token !== null;
};

export default api;