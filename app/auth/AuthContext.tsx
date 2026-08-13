import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";
import { AUTH_CONFIG } from "../../constants/auth";
import { syncToCloud, syncFromCloud, loadAllData } from "./cloudSync";
import {
  subscribeSync,
  getSyncStatus,
  setSyncToken,
  syncNow as engineSyncNow,
  stopAutoSync,
  SyncStatusInfo,
} from "./syncEngine";

interface User {
  id: number;
  google_id: string | null;
  email: string;
  name: string;
  picture: string;
  auth_provider: string;
  created_at: string;
  last_login: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isSyncing: boolean;
  hasCloudData: boolean;
  syncStatus: SyncStatusInfo;
  syncNow: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  syncLocalToCloud: () => Promise<void>;
  syncCloudToLocal: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  isSyncing: false,
  hasCloudData: false,
  syncStatus: { state: "idle", lastSyncedAt: null, message: "" },
  syncNow: async () => {},
  signInWithGoogle: async () => {},
  signInWithEmail: async () => ({}),
  signUpWithEmail: async () => ({}),
  signOut: async () => {},
  syncLocalToCloud: async () => {},
  syncCloudToLocal: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasCloudData, setHasCloudData] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatusInfo>(getSyncStatus());

  useEffect(() => {
    const unsubscribe = subscribeSync(setSyncStatus);
    return unsubscribe;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const savedToken = await AsyncStorage.getItem("@auth_token");
        if (savedToken) {
          const res = await fetch(`${AUTH_CONFIG.BACKEND_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${savedToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            setToken(savedToken);
            setUser(data.user);
            setHasCloudData(data.hasData);
            setSyncToken(savedToken);
          } else {
            await AsyncStorage.removeItem("@auth_token");
          }
        }
      } catch {}
      setIsLoading(false);
    })();
  }, []);

  const handleAuthResult = useCallback(async (appToken: string, hcd: boolean) => {
    setToken(appToken);
    setHasCloudData(hcd);
    await AsyncStorage.setItem("@auth_token", appToken);

    const res = await fetch(`${AUTH_CONFIG.BACKEND_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${appToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
    }

    setIsSyncing(true);
    try {
      if (hcd) {
        const cloudData = await syncFromCloud(appToken);
        loadAllData(cloudData.data);
      } else {
        await syncToCloud(appToken);
        setHasCloudData(true);
      }
    } finally {
      setIsSyncing(false);
    }
    setSyncToken(appToken);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      const result = await WebBrowser.openAuthSessionAsync(
        `${AUTH_CONFIG.BACKEND_URL}/api/auth/google/login`,
        "Shimer://auth-success"
      );

      if (result.type === "success" && result.url) {
        const url = new URL(result.url);
        const appToken = url.searchParams.get("token");
        const hcd = url.searchParams.get("hasData") === "true";

        if (appToken) {
          await handleAuthResult(appToken, hcd);
        }
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
    }
  }, [handleAuthResult]);

  const signOut = useCallback(async () => {
    stopAutoSync();
    setUser(null);
    setToken(null);
    setHasCloudData(false);
    setSyncStatus({ state: "idle", lastSyncedAt: null, message: "" });
    await AsyncStorage.removeItem("@auth_token");
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string, name?: string): Promise<{ error?: string }> => {
    try {
      const res = await fetch(`${AUTH_CONFIG.BACKEND_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || "Signup failed" };
      }
      await handleAuthResult(data.token, data.hasData);
      return {};
    } catch (error) {
      console.error("Signup error:", error);
      return { error: "Network error. Please try again." };
    }
  }, [handleAuthResult]);

  const signInWithEmail = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      const res = await fetch(`${AUTH_CONFIG.BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || "Login failed" };
      }
      await handleAuthResult(data.token, data.hasData);
      return {};
    } catch (error) {
      console.error("Login error:", error);
      return { error: "Network error. Please try again." };
    }
  }, [handleAuthResult]);

  const syncLocalToCloud = useCallback(async () => {
    if (!token) return;
    setIsSyncing(true);
    try {
      await syncToCloud(token);
    } catch (e) {
      console.error("Sync to cloud failed:", e);
    } finally {
      setIsSyncing(false);
    }
  }, [token]);

  const syncCloudToLocal = useCallback(async () => {
    if (!token) return;
    setIsSyncing(true);
    try {
      const cloudData = await syncFromCloud(token);
      loadAllData(cloudData.data);
    } catch (e) {
      console.error("Sync from cloud failed:", e);
    } finally {
      setIsSyncing(false);
    }
  }, [token]);

  const syncNow = useCallback(async () => {
    setIsSyncing(true);
    try {
      await engineSyncNow();
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user, token, isLoading, isSyncing, hasCloudData, syncStatus, syncNow,
        signInWithGoogle, signInWithEmail, signUpWithEmail, signOut,
        syncLocalToCloud, syncCloudToLocal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
