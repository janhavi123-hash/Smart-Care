import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useEffect, useState, useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { useAuth } from "@/contexts/AuthContext";
import { useMedicine, MedicationLog, Medicine } from "@/contexts/MedicineContext";
import { Colors } from "@/constants/colors";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatTime12(time24: string) {
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function NextReminderCard({ next }: { next: { medicine: Medicine; log: MedicationLog; minutesUntil: number } | null }) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1.04, { duration: 1500 }), -1, true);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  if (!next) {
    return (
      <View style={styles.noReminderCard}>
        <LinearGradient colors={["#22C55E", "#16A34A"]} style={styles.noReminderGrad}>
          <Ionicons name="checkmark-circle" size={40} color="#fff" />
          <Text style={styles.noReminderTitle}>All Done!</Text>
          <Text style={styles.noReminderSub}>No pending reminders for today</Text>
        </LinearGradient>
      </View>
    );
  }

  const hours = Math.floor(next.minutesUntil / 60);
  const mins = next.minutesUntil % 60;
  const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;

  return (
    <View style={styles.reminderCard}>
      <LinearGradient colors={["#1A6FE8", "#1458C0", "#0F3D8C"]} style={styles.reminderGrad}>
        <View style={styles.reminderTopRow}>
          <View>
            <Text style={styles.reminderLabel}>Next Reminder</Text>
            <Animated.Text style={[styles.reminderCountdown, animStyle]}>
              {timeStr}
            </Animated.Text>
          </View>
          <View style={styles.reminderIconCircle}>
            <Ionicons name="alarm" size={28} color="#fff" />
          </View>
        </View>
        <View style={styles.reminderDivider} />
        <View style={styles.reminderDetails}>
          <View style={styles.reminderDetailRow}>
            <Ionicons name="medkit-outline" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.reminderDetailText}>{next.medicine.name}</Text>
          </View>
          <View style={styles.reminderDetailRow}>
            <Ionicons name="flask-outline" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.reminderDetailText}>{next.medicine.dosage}</Text>
          </View>
          <View style={styles.reminderDetailRow}>
            <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.reminderDetailText}>{formatTime12(next.medicine.time)}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

function MedicineCard({
  medicine,
  log,
  onStatusChange,
}: {
  medicine: Medicine;
  log: MedicationLog;
  onStatusChange: (logId: string, status: "taken" | "missed") => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  function handlePress(status: "taken" | "missed") {
    scale.value = withSpring(0.95, { duration: 100 }, () => {
      scale.value = withSpring(1);
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onStatusChange(log.id, status);
  }

  const isTaken = log.status === "taken";
  const isMissed = log.status === "missed";

  return (
    <Animated.View style={[styles.medCard, animStyle]}>
      <View style={styles.medCardLeft}>
        <View style={[styles.medDot, { backgroundColor: isTaken ? Colors.taken : isMissed ? Colors.missed : Colors.pending }]} />
        <View>
          <Text style={styles.medName}>{medicine.name}</Text>
          <Text style={styles.medDosage}>{medicine.dosage}</Text>
          <View style={styles.medTimeRow}>
            <Ionicons name="time-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.medTime}>{formatTime12(medicine.time)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.medCardRight}>
        {log.status === "pending" ? (
          <View style={styles.actionBtns}>
            <Pressable
              style={[styles.actionBtn, styles.takenBtn]}
              onPress={() => handlePress("taken")}
            >
              <Ionicons name="checkmark" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Taken</Text>
            </Pressable>
          </View>
        ) : (
          <View style={[styles.statusBadge, { backgroundColor: isTaken ? Colors.takenLight : Colors.missedLight }]}>
            <Ionicons
              name={isTaken ? "checkmark-circle" : "close-circle"}
              size={14}
              color={isTaken ? Colors.taken : Colors.missed}
            />
            <Text style={[styles.statusText, { color: isTaken ? Colors.taken : Colors.missed }]}>
              {isTaken ? "Taken" : "Missed"}
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { getTodayMedicines, getNextReminder, updateLogStatus, isLoading, refreshLogs } = useMedicine();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const todayMeds = getTodayMedicines();
  const nextReminder = getNextReminder();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshLogs();
    setRefreshing(false);
  }, [refreshLogs]);

  async function handleStatusChange(logId: string, status: "taken" | "missed") {
    await updateLogStatus(logId, status);
  }

  if (isLoading) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) },
        ]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>{user?.name ?? "Friend"}</Text>
            <Text style={styles.dateText}>{formatDate()}</Text>
          </View>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {(user?.name ?? "U").charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>

        <NextReminderCard next={nextReminder} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Medications</Text>
          <Text style={styles.sectionCount}>{todayMeds.length} total</Text>
        </View>

        {todayMeds.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="medical-outline" size={48} color={Colors.border} />
            <Text style={styles.emptyTitle}>No medications today</Text>
            <Text style={styles.emptySubtitle}>Add medicines using the + tab below</Text>
          </View>
        ) : (
          todayMeds.map(({ medicine, log }) => (
            <MedicineCard
              key={log.id}
              medicine={medicine}
              log={log}
              onStatusChange={handleStatusChange}
            />
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    marginTop: 16,
  },
  greeting: {
    fontSize: 15,
    fontFamily: "Nunito_400Regular",
    color: Colors.textSecondary,
  },
  userName: {
    fontSize: 26,
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.text,
    marginTop: 2,
  },
  dateText: {
    fontSize: 13,
    fontFamily: "Nunito_400Regular",
    color: Colors.textTertiary,
    marginTop: 3,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 22,
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.primary,
  },
  reminderCard: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  reminderGrad: {
    padding: 20,
  },
  reminderTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  reminderLabel: {
    fontSize: 13,
    fontFamily: "Nunito_600SemiBold",
    color: "rgba(255,255,255,0.75)",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  reminderCountdown: {
    fontSize: 38,
    fontFamily: "Nunito_800ExtraBold",
    color: "#fff",
    marginTop: 4,
  },
  reminderIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  reminderDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginVertical: 14,
  },
  reminderDetails: {
    gap: 6,
  },
  reminderDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reminderDetailText: {
    fontSize: 15,
    fontFamily: "Nunito_600SemiBold",
    color: "rgba(255,255,255,0.9)",
  },
  noReminderCard: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 24,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  noReminderGrad: {
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  noReminderTitle: {
    fontSize: 22,
    fontFamily: "Nunito_800ExtraBold",
    color: "#fff",
  },
  noReminderSub: {
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.text,
  },
  sectionCount: {
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.textSecondary,
  },
  medCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  medCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  medDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  medName: {
    fontSize: 17,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
  },
  medDosage: {
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
    color: Colors.textSecondary,
    marginTop: 2,
  },
  medTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  medTime: {
    fontSize: 13,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.textSecondary,
  },
  medCardRight: {
    alignItems: "flex-end",
  },
  actionBtns: {
    gap: 6,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
  },
  takenBtn: {
    backgroundColor: Colors.taken,
  },
  actionBtnText: {
    fontSize: 13,
    fontFamily: "Nunito_700Bold",
    color: "#fff",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 13,
    fontFamily: "Nunito_700Bold",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Nunito_700Bold",
    color: Colors.textSecondary,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
    color: Colors.textTertiary,
    textAlign: "center",
  },
});
