import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  caregiverName: string;
  caregiverPhone: string;
}

interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEYS = {
  USERS: "smartcare_users",
  CURRENT_USER: "smartcare_current_user",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  async function loadCurrentUser() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load user", e);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
    const users: (UserProfile & { password: string })[] = stored
      ? JSON.parse(stored)
      : [];

    const found = users.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.password === password,
    );
    if (!found) {
      throw new Error("Invalid email or password");
    }

    const { password: _, ...profile } = found;
    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(profile));
    setUser(profile);
  }

  async function register(name: string, email: string, password: string) {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
    const users: (UserProfile & { password: string })[] = stored
      ? JSON.parse(stored)
      : [];

    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error("An account with this email already exists");
    }

    const newUser: UserProfile & { password: string } = {
      id: Date.now().toString(),
      name,
      email,
      password,
      caregiverName: "",
      caregiverPhone: "",
    };

    users.push(newUser);
    await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    const { password: _, ...profile } = newUser;
    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(profile));
    setUser(profile);
  }

  async function logout() {
    await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    setUser(null);
  }

  async function updateProfile(updates: Partial<UserProfile>) {
    if (!user) return;
    const updated = { ...user, ...updates };

    const stored = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
    const users: (UserProfile & { password: string })[] = stored
      ? JSON.parse(stored)
      : [];
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates };
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }

    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updated));
    setUser(updated);
  }

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isLoggedIn: !!user,
      login,
      register,
      logout,
      updateProfile,
    }),
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
