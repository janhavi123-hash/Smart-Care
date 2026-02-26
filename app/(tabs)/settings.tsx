import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/contexts/AuthContext";
import { useMedicine } from "@/contexts/MedicineContext";
import { Colors } from "@/constants/colors";

export default function SettingsScreen() {
  const { user, logout, updateProfile } = useAuth();
  const { medicines, deleteMedicine } = useMedicine();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState(user?.name ?? "");
  const [caregiverName, setCaregiverName] = useState(user?.caregiverName ?? "");
  const [caregiverPhone, setCaregiverPhone] = useState(user?.caregiverPhone ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await updateProfile({
        name: name.trim(),
        caregiverName: caregiverName.trim(),
        caregiverPhone: caregiverPhone.trim(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  }

  function handleLogout() {
    if (Platform.OS === "web") {
      logout().then(() => router.replace("/(auth)/login"));
      return;
    }
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out of SmartCare?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await logout();
            router.replace("/(auth)/login");
          },
        },
      ],
    );
  }

  function handleDeleteMedicine(id: string, medName: string) {
    if (Platform.OS === "web") {
      deleteMedicine(id);
      return;
    }
    Alert.alert(
      "Delete Medicine",
      `Are you sure you want to delete "${medName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            deleteMedicine(id);
          },
        },
      ],
    );
  }

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) },
        ]}
      >
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>Manage your account & medicines</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.profileRow}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {(user?.name ?? "U").charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.profileName}>{user?.name}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>
        </View>

        <SectionHeader title="Profile" icon="person-outline" />
        <View style={styles.card}>
          <FieldRow label="Full Name" icon="person-outline">
            <TextInput
              style={styles.fieldInput}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={Colors.textTertiary}
              autoCapitalize="words"
            />
          </FieldRow>
        </View>

        <SectionHeader title="Caregiver" icon="heart-outline" />
        <View style={styles.card}>
          <FieldRow label="Caregiver Name" icon="person-add-outline">
            <TextInput
              style={styles.fieldInput}
              value={caregiverName}
              onChangeText={setCaregiverName}
              placeholder="Caregiver full name"
              placeholderTextColor={Colors.textTertiary}
              autoCapitalize="words"
            />
          </FieldRow>
          <View style={styles.divider} />
          <FieldRow label="Phone Number" icon="call-outline">
            <TextInput
              style={styles.fieldInput}
              value={caregiverPhone}
              onChangeText={setCaregiverPhone}
              placeholder="+1 (555) 000-0000"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="phone-pad"
            />
          </FieldRow>
        </View>

        {user?.caregiverPhone ? (
          <View style={styles.emergencyCard}>
            <View style={styles.emergencyHeader}>
              <Ionicons name="warning" size={18} color={Colors.danger} />
              <Text style={styles.emergencyTitle}>Emergency Contact</Text>
            </View>
            <Text style={styles.emergencyText}>
              In an emergency, tap the button below to send an SMS alert to {user.caregiverName || "your caregiver"} at {user.caregiverPhone}.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.emergencyBtn, pressed && { opacity: 0.85 }]}
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                Alert.alert(
                  "Emergency Alert",
                  `SMS would be sent to ${user.caregiverName || "caregiver"} at ${user.caregiverPhone}: "Emergency: Please check on me immediately. - SmartCare App"`,
                  [{ text: "OK" }]
                );
              }}
            >
              <Ionicons name="warning" size={18} color="#fff" />
              <Text style={styles.emergencyBtnText}>Send Emergency Alert</Text>
            </Pressable>
          </View>
        ) : null}

        <Pressable
          style={({ pressed }) => [
            styles.saveBtn,
            pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
            isSaving && { opacity: 0.6 },
          ]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : saved ? (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>Saved!</Text>
            </>
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </>
          )}
        </Pressable>

        {medicines.length > 0 && (
          <>
            <SectionHeader title="My Medicines" icon="medkit-outline" />
            <View style={styles.card}>
              {medicines.map((med, i) => (
                <View key={med.id}>
                  {i > 0 && <View style={styles.divider} />}
                  <View style={styles.medRow}>
                    <View style={styles.medLeft}>
                      <Text style={styles.medName}>{med.name}</Text>
                      <Text style={styles.medDetails}>{med.dosage} · {med.time}</Text>
                    </View>
                    <Pressable
                      onPress={() => handleDeleteMedicine(med.id, med.name)}
                      style={styles.deleteBtn}
                    >
                      <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        <Pressable
          style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.85 }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </Pressable>

        <View style={{ height: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 40 }} />
      </ScrollView>
    </View>
  );
}

function SectionHeader({ title, icon }: { title: string; icon: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon as any} size={15} color={Colors.textSecondary} />
      <Text style={styles.sectionHeaderText}>{title.toUpperCase()}</Text>
    </View>
  );
}

function FieldRow({ label, icon, children }: { label: string; icon: string; children: React.ReactNode }) {
  return (
    <View style={styles.fieldRow}>
      <View style={styles.fieldLeft}>
        <Ionicons name={icon as any} size={18} color={Colors.textSecondary} />
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      <View style={styles.fieldRight}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 12,
    gap: 6,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarText: {
    fontSize: 26,
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.primary,
  },
  profileName: {
    fontSize: 18,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
  },
  profileEmail: {
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 4,
    marginTop: 12,
    marginBottom: 6,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontFamily: "Nunito_700Bold",
    color: Colors.textSecondary,
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: 16,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    gap: 8,
  },
  fieldLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 130,
  },
  fieldLabel: {
    fontSize: 15,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.text,
  },
  fieldRight: { flex: 1, alignItems: "flex-end" },
  fieldInput: {
    fontSize: 15,
    fontFamily: "Nunito_400Regular",
    color: Colors.text,
    textAlign: "right",
    minWidth: 120,
  },
  emergencyCard: {
    backgroundColor: Colors.dangerLight,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.danger + "30",
    marginTop: 8,
    gap: 10,
  },
  emergencyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  emergencyTitle: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: Colors.danger,
  },
  emergencyText: {
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
    color: Colors.text,
    lineHeight: 20,
  },
  emergencyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.danger,
    borderRadius: 12,
    padding: 12,
  },
  emergencyBtnText: {
    fontSize: 15,
    fontFamily: "Nunito_700Bold",
    color: "#fff",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 52,
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: "#fff",
  },
  medRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  medLeft: { flex: 1 },
  medName: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
  },
  medDetails: {
    fontSize: 13,
    fontFamily: "Nunito_400Regular",
    color: Colors.textSecondary,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 8,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.dangerLight,
    borderRadius: 14,
    height: 52,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.danger + "30",
  },
  logoutText: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: Colors.danger,
  },
});
