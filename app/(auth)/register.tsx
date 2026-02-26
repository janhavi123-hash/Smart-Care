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

export default function RegisterScreen() {
  const { register } = useAuth();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setError("");
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await register(name.trim(), email.trim(), password);
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e.message || "Registration failed. Please try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#1A6FE8", "#1458C0"]}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <View style={styles.logoCircle}>
          <Ionicons name="person-add" size={32} color="#fff" />
        </View>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join SmartCare today</Text>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color={Colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Field
            label="Full Name"
            icon="person-outline"
            placeholder="Your full name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <Field
            label="Email Address"
            icon="mail-outline"
            placeholder="your@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Minimum 6 characters"
                placeholderTextColor={Colors.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
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
            style={({ pressed }) => [styles.btn, pressed && styles.btnPressed, isLoading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Create Account</Text>
            )}
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.footerLink}>Sign In</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ height: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 20 }} />
      </ScrollView>
    </View>
  );
}

function Field({
  label, icon, placeholder, value, onChangeText, keyboardType, autoCapitalize,
}: {
  label: string;
  icon: string;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: any;
  autoCapitalize?: any;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <Ionicons name={icon as any} size={20} color={Colors.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.textTertiary}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    alignItems: "center",
    paddingBottom: 36,
    paddingHorizontal: 20,
  },
  backBtn: {
    position: "absolute",
    left: 20,
    top: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    fontFamily: "Nunito_800ExtraBold",
    color: "#fff",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingTop: 0 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    marginTop: -20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
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
  inputGroup: { marginBottom: 16 },
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
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Nunito_400Regular",
    color: Colors.text,
  },
  eyeBtn: { padding: 4 },
  btn: {
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
  btnPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  btnDisabled: { opacity: 0.6 },
  btnText: {
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
