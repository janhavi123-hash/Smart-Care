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
  Linking,
} from "react-native";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/contexts/AuthContext";
import { useMedicine } from "@/contexts/MedicineContext";
import { Colors } from "@/constants/colors";

function buildSmsUrl(phone: string, message: string): string {
  const encoded = encodeURIComponent(message);
  if (Platform.OS === "ios") {
    return `sms:${phone}&body=${encoded}`;
  }
  return `sms:${phone}?body=${encoded}`;
}

async function openSMS(phone: string, message: string): Promise<boolean> {
  try {
    const url = buildSmsUrl(phone, message);
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export default function SettingsScreen() {
  const { user, logout, updateProfile } = useAuth();
  const { medicines, deleteMedicine, getWeeklyMissedCount } = useMedicine();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState(user?.name ?? "");
  const [caregiverName, setCaregiverName] = useState(user?.caregiverName ?? "");
  const [caregiverPhone, setCaregiverPhone] = useState(user?.caregiverPhone ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const weeklyMissed = getWeeklyMissedCount();
  const hasCaregiverPhone = !!(user?.caregiverPhone);

  useEffect(() => {
    if (weeklyMissed >= 3 && hasCaregiverPhone && user?.caregiverPhone) {
      const alertKey = `smartcare_weekly_alert_${new Date().toISOString().split("T")[0].slice(0, 7)}`;
      const alreadyShown = (global as any)[alertKey];
      if (!alreadyShown) {
        (global as any)[alertKey] = true;
        const msg = buildWeeklyMissedMessage(user.name, user.caregiverName ?? "Caregiver", weeklyMissed);
        Alert.alert(
          "Missed Dose Alert",
          `${weeklyMissed} doses have been missed this week. Would you like to notify ${user.caregiverName || "your caregiver"}?`,
          [
            { text: "Not Now", style: "cancel" },
            {
              text: "Send SMS",
              onPress: async () => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                const sent = await openSMS(user.caregiverPhone!, msg);
                if (!sent) {
                  Alert.alert("Cannot Open SMS", "Please check that an SMS app is available on your device.");
                }
              },
            },
          ]
        );
      }
    }
  }, [weeklyMissed]);

  function buildWeeklyMissedMessage(patientName: string, cName: string, count: number): string {
    return `Dear ${cName},\n\nThis is an automated health alert from SmartCare. Your care recipient, ${patientName || "your patient"}, has missed ${count} scheduled medication dose${count !== 1 ? "s" : ""} this week.\n\nMissing multiple doses can impact their health and treatment outcomes. We kindly request that you check in with them at your earliest convenience to ensure they remain on track with their medication schedule.\n\nThank you for your care and support.\n\n— SmartCare App`;
  }

  function buildEmergencyMessage(patientName: string): string {
    return `EMERGENCY ALERT from SmartCare\n\nDear Caregiver,\n\n${patientName || "Your care recipient"} requires immediate assistance. Please check on them right away.\n\nThis alert was sent via SmartCare medication reminder app.\n\nPlease respond urgently.`;
  }

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

  async function handleEmergencyAlert() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const phone = user?.caregiverPhone ?? "";
    const msg = buildEmergencyMessage(user?.name ?? "");
    if (!phone) {
      Alert.alert("No Caregiver Phone", "Please add a caregiver phone number in the fields above and save.");
      return;
    }

    if (Platform.OS === "web") {
      Alert.alert(
        "Emergency Alert",
        `On mobile, this would open SMS to ${user?.caregiverName || "caregiver"} (${phone}) with an emergency message.`,
        [{ text: "OK" }]
      );
      return;
    }

    Alert.alert(
      "Send Emergency Alert",
      `This will open your SMS app with an emergency message to ${user?.caregiverName || "your caregiver"} at ${phone}.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Open SMS",
          style: "destructive",
          onPress: async () => {
            const sent = await openSMS(phone, msg);
            if (!sent) {
              Alert.alert(
                "Cannot Open SMS",
                "Your device does not support SMS or no SMS app is installed.",
                [{ text: "OK" }]
              );
            }
          },
        },
      ]
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

        {weeklyMissed >= 3 && (
          <View style={styles.warningBanner}>
            <Ionicons name="warning" size={22} color="#fff" />
            <Text style={styles.warningBannerText}>
              {weeklyMissed} doses missed this week — consider alerting your caregiver
            </Text>
          </View>
        )}

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
          <FieldRow label="Name" icon="person-add-outline">
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
          <FieldRow label="Phone" icon="call-outline">
            <TextInput
              style={styles.fieldInput}
              value={caregiverPhone}
              onChangeText={setCaregiverPhone}
              placeholder="+1 555 000 0000"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="phone-pad"
            />
          </FieldRow>
        </View>

        {(user?.caregiverPhone || caregiverPhone) ? (
          <View style={styles.emergencyCard}>
            <View style={styles.emergencyHeader}>
              <Ionicons name="warning" size={22} color={Colors.danger} />
              <Text style={styles.emergencyTitle}>Emergency Contact</Text>
            </View>
            <Text style={styles.emergencyText}>
              Tap the button below to send an emergency SMS to{" "}
              <Text style={{ fontFamily: "Nunito_700Bold" }}>
                {user?.caregiverName || caregiverName || "your caregiver"}
              </Text>
              {" "}at{" "}
              <Text style={{ fontFamily: "Nunito_700Bold" }}>
                {user?.caregiverPhone || caregiverPhone}
              </Text>
              . This will open your SMS app with a pre-filled urgent message.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.emergencyBtn, pressed && { opacity: 0.85 }]}
              onPress={handleEmergencyAlert}
            >
              <Ionicons name="warning" size={22} color="#fff" />
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
              <Ionicons name="checkmark-circle" size={22} color="#fff" />
              <Text style={styles.saveBtnText}>Saved!</Text>
            </>
          ) : (
            <>
              <Ionicons name="save-outline" size={22} color="#fff" />
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
                      <Ionicons name="trash-outline" size={20} color={Colors.danger} />
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
          <Ionicons name="log-out-outline" size={22} color={Colors.danger} />
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
      <Ionicons name={icon as any} size={16} color={Colors.textSecondary} />
      <Text style={styles.sectionHeaderText}>{title.toUpperCase()}</Text>
    </View>
  );
}

function FieldRow({ label, icon, children }: { label: string; icon: string; children: React.ReactNode }) {
  return (
    <View style={styles.fieldRow}>
      <View style={styles.fieldLeft}>
        <Ionicons name={icon as any} size={20} color={Colors.textSecondary} />
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
    fontSize: 30,
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 16,
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
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarText: {
    fontSize: 28,
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.primary,
  },
  profileName: {
    fontSize: 20,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
  },
  profileEmail: {
    fontSize: 15,
    fontFamily: "Nunito_400Regular",
    color: Colors.textSecondary,
    marginTop: 2,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.danger,
    borderRadius: 14,
    padding: 14,
    marginBottom: 4,
  },
  warningBannerText: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: "#fff",
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
    fontSize: 14,
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
    padding: 16,
    gap: 8,
  },
  fieldLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 100,
  },
  fieldLabel: {
    fontSize: 17,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.text,
  },
  fieldRight: { flex: 1, alignItems: "flex-end" },
  fieldInput: {
    fontSize: 17,
    fontFamily: "Nunito_400Regular",
    color: Colors.text,
    textAlign: "right",
    minWidth: 130,
  },
  emergencyCard: {
    backgroundColor: Colors.dangerLight,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.danger + "30",
    marginTop: 8,
    gap: 12,
  },
  emergencyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  emergencyTitle: {
    fontSize: 18,
    fontFamily: "Nunito_700Bold",
    color: Colors.danger,
  },
  emergencyText: {
    fontSize: 16,
    fontFamily: "Nunito_400Regular",
    color: Colors.text,
    lineHeight: 24,
  },
  emergencyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.danger,
    borderRadius: 14,
    padding: 16,
  },
  emergencyBtnText: {
    fontSize: 18,
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
    height: 58,
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveBtnText: {
    fontSize: 18,
    fontFamily: "Nunito_700Bold",
    color: "#fff",
  },
  medRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  medLeft: { flex: 1 },
  medName: {
    fontSize: 18,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
  },
  medDetails: {
    fontSize: 15,
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
    height: 56,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.danger + "30",
  },
  logoutText: {
    fontSize: 18,
    fontFamily: "Nunito_700Bold",
    color: Colors.danger,
  },
});
