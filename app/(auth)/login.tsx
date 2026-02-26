import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/contexts/AuthContext";
import { Colors } from "@/constants/colors";

export default function LoginScreen() {
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }
    setError("");
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await login(email.trim(), password);
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e.message || "Login failed. Please try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#1A6FE8", "#1458C0", "#0F3D8C"]}
        style={[styles.header, { paddingTop: insets.top + 40 }]}
      >
        <View style={styles.logoCircle}>
          <Ionicons name="medkit" size={36} color="#fff" />
        </View>
        <Text style={styles.appName}>SmartCare</Text>
        <Text style={styles.tagline}>Your Medicine Reminder Companion</Text>
      </LinearGradient>

      <View style={styles.card}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to manage your medications</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={Colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor={Colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Enter password"
              placeholderTextColor={Colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="password"
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={Colors.textSecondary}
              />
            </Pressable>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.loginBtn, pressed && styles.btnPressed, isLoading && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginBtnText}>Sign In</Text>
          )}
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <Pressable onPress={() => router.push("/(auth)/register")}>
            <Text style={styles.footerLink}>Create Account</Text>
          </Pressable>
        </View>
      </View>

      <View style={{ height: insets.bottom + (Platform.OS === "web" ? 34 : 0) }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: "center",
    paddingBottom: 40,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  appName: {
    fontSize: 32,
    fontFamily: "Nunito_800ExtraBold",
    color: "#fff",
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    margin: 16,
    padding: 24,
    marginTop: -24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 26,
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Nunito_400Regular",
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dangerLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.danger,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.borderLight,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Nunito_400Regular",
    color: Colors.text,
  },
  eyeBtn: {
    padding: 4,
  },
  loginBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  btnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    fontSize: 17,
    fontFamily: "Nunito_700Bold",
    color: "#fff",
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    gap: 6,
  },
  footerText: {
    fontSize: 15,
    fontFamily: "Nunito_400Regular",
    color: Colors.textSecondary,
  },
  footerLink: {
    fontSize: 15,
    fontFamily: "Nunito_700Bold",
    color: Colors.primary,
  },
});
