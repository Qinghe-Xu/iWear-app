/** 登录态与主题的全局 store（React Context）。 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { api, setAuthToken, setUnauthorizedHandler, type UserProfile } from './api';
import { getItem, removeItem, setItem, STORAGE_KEYS } from './storage';
import { palettes, type Palette, type ThemeName } from './theme';

type AuthState = {
  status: 'loading' | 'signedOut' | 'signedIn';
  profile: UserProfile | null;
  /** 首次登录需要完善资料 */
  needsOnboarding: boolean;
  signIn: (token: string, isNewUser: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  saveProfile: (patch: Partial<UserProfile>) => Promise<void>;
};

type ThemeState = {
  palette: Palette;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
  ready: boolean;
};

const AuthContext = createContext<AuthState | null>(null);
const ThemeContext = createContext<ThemeState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthState['status']>('loading');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [themeName, setThemeName] = useState<ThemeName>('plain');
  const [themeReady, setThemeReady] = useState(false);
  const mounted = useRef(true);

  const clearSession = useCallback(async () => {
    setAuthToken(null);
    await removeItem(STORAGE_KEYS.token);
    if (!mounted.current) return;
    setProfile(null);
    setNeedsOnboarding(false);
    setStatus('signedOut');
  }, []);

  const refreshProfile = useCallback(async () => {
    const data = await api.get<UserProfile>('/api/user/profile');
    if (mounted.current) setProfile(data);
  }, []);

  useEffect(() => {
    mounted.current = true;
    setUnauthorizedHandler(() => {
      void clearSession();
    });
    (async () => {
      const [token, savedTheme] = await Promise.all([
        getItem(STORAGE_KEYS.token),
        getItem(STORAGE_KEYS.theme),
      ]);
      if (savedTheme === 'plain' || savedTheme === 'rose') setThemeName(savedTheme);
      setThemeReady(true);
      if (!token) {
        setStatus('signedOut');
        return;
      }
      setAuthToken(token);
      try {
        const data = await api.get<UserProfile>('/api/user/profile');
        if (!mounted.current) return;
        setProfile(data);
        setStatus('signedIn');
      } catch {
        await clearSession();
      }
    })();
    return () => {
      mounted.current = false;
      setUnauthorizedHandler(null);
    };
  }, [clearSession]);

  const signIn = useCallback(async (token: string, isNewUser: boolean) => {
    setAuthToken(token);
    await setItem(STORAGE_KEYS.token, token);
    const data = await api.get<UserProfile>('/api/user/profile');
    if (!mounted.current) return;
    setProfile(data);
    setNeedsOnboarding(isNewUser);
    setStatus('signedIn');
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // token 已失效或网络不可用时，仍要在本地退出
    }
    await clearSession();
  }, [clearSession]);

  const saveProfile = useCallback(async (patch: Partial<UserProfile>) => {
    const updated = await api.put<UserProfile>('/api/user/profile', patch);
    if (mounted.current) {
      setProfile(updated);
      setNeedsOnboarding(false);
    }
  }, []);

  const setTheme = useCallback((name: ThemeName) => {
    setThemeName(name);
    void setItem(STORAGE_KEYS.theme, name);
  }, []);

  const authValue = useMemo<AuthState>(
    () => ({ status, profile, needsOnboarding, signIn, signOut, refreshProfile, saveProfile }),
    [status, profile, needsOnboarding, signIn, signOut, refreshProfile, saveProfile],
  );

  const themeValue = useMemo<ThemeState>(
    () => ({ palette: palettes[themeName], themeName, setTheme, ready: themeReady }),
    [themeName, setTheme, themeReady],
  );

  return (
    <ThemeContext.Provider value={themeValue}>
      <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
    </ThemeContext.Provider>
  );
}

export function useAuth(): AuthState {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth 必须在 AppProvider 内使用');
  return value;
}

export function useTheme(): ThemeState {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme 必须在 AppProvider 内使用');
  return value;
}
