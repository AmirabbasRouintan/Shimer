import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { AUTH_CONFIG } from "../../constants/auth";
import { syncToCloud, syncFromCloud, loadAllData, collectAllData } from "./cloudSync";

WebBrowser.maybeCompleteAuthSession();

interface User {
  id: number;
  google_id: string;
  email: string;
  name: string;
  picture: string;
  created_at: string;
  last_login: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isSyncing: boolean;
  hasCloudData: boolean;
  signInWithGoogle: () => Promise<void>;
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
  signInWithGoogle: async () => {},
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

  const [, response, googlePrompt] = Google.useAuthRequest({
    clientId: AUTH_CONFIG.GOOGLE_CLIENT_ID,
  });

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
          } else {
            await AsyncStorage.removeItem("@auth_token");
          }
        }
      } catch {}
      setIsLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (response?.type === "success") {
      handleGoogleResponse(response.params.id_token);
    }
  }, [response]);

  const handleGoogleResponse = async (idToken: string) => {
    try {
      setIsSyncing(true);
      const res = await fetch(`${AUTH_CONFIG.BACKEND_URL}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) throw new Error("Auth failed");

      const data = await res.json();
      setToken(data.token);
      setUser(data.user);
      setHasCloudData(data.hasData);
      await AsyncStorage.setItem("@auth_token", data.token);

      if (data.hasData) {
        const cloudData = await syncFromCloud(data.token);
        loadAllData(cloudData.data);
      } else {
        await syncToCloud(data.token);
        setHasCloudData(true);
      }
    } catch (error) {
      console.error("Google auth error:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const signInWithGoogle = useCallback(async () => {
    await googlePrompt();
  }, [googlePrompt]);

  const signOut = useCallback(async () => {
    setUser(null);
    setToken(null);
    setHasCloudData(false);
    await AsyncStorage.removeItem("@auth_token");
  }, []);

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

  return (
    <AuthContext.Provider
      value={{
        user, token, isLoading, isSyncing, hasCloudData,
        signInWithGoogle, signOut, syncLocalToCloud, syncCloudToLocal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
