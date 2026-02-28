import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  favorites: '@PedalGo:favorites',
};

export async function saveFavorites(favorites: string[]): Promise<void> {
  try {
    const jsonValue = JSON.stringify(favorites);
    await AsyncStorage.setItem(STORAGE_KEYS.favorites, jsonValue);
  } catch (error) {
    console.error('Error saving favorites:', error);
    throw error;
  }
}

export async function loadFavorites(): Promise<string[]> {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.favorites);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('Error loading favorites:', error);
    return [];
  }
}

export async function clearFavorites(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.favorites);
  } catch (error) {
    console.error('Error clearing favorites:', error);
    throw error;
  }
}
