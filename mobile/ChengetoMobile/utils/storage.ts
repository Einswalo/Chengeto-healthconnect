import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

// Token functions
export const saveToken = async (token: string) => {
  try {
    console.log('💾 [storage] Saving token');
    await AsyncStorage.setItem(TOKEN_KEY, token);
    console.log('✅ [storage] Token saved');
  } catch (error) {
    console.error('Error saving token:', error);
  }
};

export const getToken = async () => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    console.log('🔑 [storage] Retrieved token:', token ? 'Yes' : 'No');
    return token;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

export const removeToken = async () => {
  try {
    console.log('🗑️ [storage] Removing token');
    await AsyncStorage.removeItem(TOKEN_KEY);
    console.log('✅ [storage] Token removed');
  } catch (error) {
    console.error('Error removing token:', error);
  }
};

// User data functions (optional)
export const saveUserData = async (userData: any) => {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
  } catch (error) {
    console.error('Error saving user data:', error);
  }
};

export const getUserData = async () => {
  try {
    const data = await AsyncStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

export const removeUserData = async () => {
  try {
    await AsyncStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error('Error removing user data:', error);
  }
};

// Clear all storage (logout)
export const clearAllStorage = async () => {
  try {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    console.log('✅ All storage cleared');
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
};