/** 跨平台本地存储：手机用 SecureStore，浏览器用 AsyncStorage。 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const web = Platform.OS === 'web';

export async function getItem(key: string): Promise<string | null> {
  try {
    return web ? await AsyncStorage.getItem(key) : await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  try {
    if (web) await AsyncStorage.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
  } catch {
    // 存储不可用时静默降级，页面仍可工作，只是重启后需要重新登录或恢复默认主题
  }
}

export async function removeItem(key: string): Promise<void> {
  try {
    if (web) await AsyncStorage.removeItem(key);
    else await SecureStore.deleteItemAsync(key);
  } catch {
    // 忽略
  }
}

export const STORAGE_KEYS = {
  token: 'iwear.token',
  theme: 'iwear.theme',
} as const;
