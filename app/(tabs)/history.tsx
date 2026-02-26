import {
  View,
  Text,
  StyleSheet,
  SectionList,
  Pressable,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useState, useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useMedicine, MedicationLog } from "@/contexts/MedicineContext";
import { Colors } from "@/constants/colors";

function formatDateLabel(dateStr: string) {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (dateStr === today) return "Today";
  if (dateStr === yesterdayStr) return "Yesterday";

  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
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

function LogItem({ item }: { item: MedicationLog }) {
  const isTaken = item.status === "taken";
  const isMissed = item.status === "missed";
  const isPending = item.status === "pending";

  const statusColor = isTaken ? Colors.taken : isMissed ? Colors.missed : Colors.pending;
  const statusBg = isTaken ? Colors.takenLight : isMissed ? Colors.missedLight : Colors.pendingLight;
  const statusIcon = isTaken ? "checkmark-circle" : isMissed ? "close-circle" : "time";
  const statusLabel = isTaken ? "Taken" : isMissed ? "Missed" : "Pending";

  return (
    <View style={styles.logItem}>
      <View style={[styles.logStatusBar, { backgroundColor: statusColor }]} />
      <View style={styles.logContent}>
        <View style={styles.logLeft}>
          <Text style={styles.logMedName}>{item.medicineName}</Text>
          <Text style={styles.logDosage}>{item.dosage}</Text>
          <View style={styles.logTimeRow}>
            <Ionicons name="time-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.logTime}>{formatTime12(item.scheduledTime)}</Text>
          </View>
        </View>
        <View style={[styles.logBadge, { backgroundColor: statusBg }]}>
          <Ionicons name={statusIcon as any} size={14} color={statusColor} />
          <Text style={[styles.logBadgeText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const { logs, isLoading, refreshLogs } = useMedicine();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "taken" | "missed" | "pending">("all");

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshLogs();
    setRefreshing(false);
  }, [refreshLogs]);

  const filteredLogs = filter === "all" ? logs : logs.filter((l) => l.status === filter);

  const groupedByDate = filteredLogs.reduce(
    (acc, log) => {
      if (!acc[log.date]) acc[log.date] = [];
      acc[log.date].push(log);
      return acc;
    },
    {} as Record<string, MedicationLog[]>,
  );

  const sections = Object.keys(groupedByDate)
    .sort((a, b) => b.localeCompare(a))
    .map((date) => ({
      title: date,
      data: groupedByDate[date].sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime)),
    }));

  const FILTERS: { key: typeof filter; label: string; icon: string }[] = [
    { key: "all", label: "All", icon: "list" },
    { key: "taken", label: "Taken", icon: "checkmark-circle" },
    { key: "missed", label: "Missed", icon: "close-circle" },
    { key: "pending", label: "Pending", icon: "time" },
  ];

  if (isLoading) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
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
        <Text style={styles.headerTitle}>History</Text>
        <Text style={styles.headerSubtitle}>Your medication log</Text>

        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <Pressable
              key={f.key}
              style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
              onPress={() => setFilter(f.key)}
            >
              <Ionicons
                name={f.icon as any}
                size={14}
                color={filter === f.key ? "#fff" : Colors.textSecondary}
              />
              <Text
                style={[styles.filterBtnText, filter === f.key && styles.filterBtnTextActive]}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {sections.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={56} color={Colors.border} />
          <Text style={styles.emptyTitle}>No records found</Text>
          <Text style={styles.emptySubtitle}>
            {filter === "all"
              ? "Add medicines to start tracking your adherence"
              : `No ${filter} medications found`}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <LogItem item={item} />}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{formatDateLabel(section.title)}</Text>
              <Text style={styles.sectionCount}>{section.data.length}</Text>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
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
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.borderLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterBtnText: {
    fontSize: 13,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.textSecondary,
  },
  filterBtnTextActive: { color: "#fff" },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    marginTop: 16,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
  },
  sectionCount: {
    fontSize: 13,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.textSecondary,
    backgroundColor: Colors.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  logItem: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 8,
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  logStatusBar: {
    width: 4,
  },
  logContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  logLeft: { flex: 1 },
  logMedName: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
  },
  logDosage: {
    fontSize: 13,
    fontFamily: "Nunito_400Regular",
    color: Colors.textSecondary,
    marginTop: 2,
  },
  logTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  logTime: {
    fontSize: 13,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.textSecondary,
  },
  logBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  logBadgeText: {
    fontSize: 13,
    fontFamily: "Nunito_700Bold",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 30,
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
