'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { User } from '@/types';
import { api } from '@/lib/api';
import { ConfirmProvider, useConfirm } from '@/components/ui/confirm-dialog';

export { useConfirm };

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: { email: string; password: string }) => Promise<void>;
  register: (data: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: { name: string }) => Promise<User>;
  refreshUser: () => Promise<void>;
}

import { ColorPaletteId } from '@/types/palette';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  colorPalette: ColorPaletteId;
  setColorPalette: (palette: ColorPaletteId) => void;
}

interface NavigationContextType {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  toggleMobile: () => void;
  closeMobile: () => void;
  isTabletCollapsed: boolean;
  toggleTabletCollapse: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within Providers');
  return context;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within Providers');
  return context;
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) throw new Error('useNavigation must be used within Providers');
  return context;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [colorPalette, setColorPaletteState] = useState<ColorPaletteId>('ocean');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isTabletCollapsed, setIsTabletCollapsed] = useState(false);

  const toggleMobile = () => setIsMobileOpen((prev) => !prev);
  const closeMobile = () => setIsMobileOpen(false);
  const toggleTabletCollapse = () => setIsTabletCollapsed((prev) => !prev);

  // Close mobile drawer when resizing up to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize theme and color palette from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('docora_theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const savedPalette = (localStorage.getItem('docora_palette') as ColorPaletteId) || 'ocean';
    setColorPaletteState(savedPalette);
    document.documentElement.setAttribute('data-palette', savedPalette);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('docora_theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const setColorPalette = (palette: ColorPaletteId) => {
    setColorPaletteState(palette);
    localStorage.setItem('docora_palette', palette);
    document.documentElement.setAttribute('data-palette', palette);
  };

  // Check current session
  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = await api.me();
        setUser(currentUser);
      } catch {
        api.clearTokens();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (data: { email: string; password: string }) => {
    const res = await api.login(data);
    setUser(res.user);
  };

  const register = async (data: { name: string; email: string; password: string }) => {
    const res = await api.register(data);
    setUser(res.user);
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    window.location.href = '/login';
  };

  const updateUserProfile = async (data: { name: string }) => {
    const updated = await api.updateProfile(data);
    setUser(updated);
    return updated;
  };

  const refreshUser = async () => {
    try {
      const u = await api.me();
      setUser(u);
    } catch {
      // User may not be logged in
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeContext.Provider value={{ theme, toggleTheme, colorPalette, setColorPalette }}>
        <NavigationContext.Provider
          value={{
            isMobileOpen,
            setIsMobileOpen,
            toggleMobile,
            closeMobile,
            isTabletCollapsed,
            toggleTabletCollapse,
          }}
        >
          <AuthContext.Provider
            value={{
              user,
              isLoading,
              login,
              register,
              logout,
              updateUserProfile,
              refreshUser,
            }}
          >
            <ConfirmProvider>
              {children}
            </ConfirmProvider>
          </AuthContext.Provider>
        </NavigationContext.Provider>
      </ThemeContext.Provider>
    </QueryClientProvider>
  );
}
