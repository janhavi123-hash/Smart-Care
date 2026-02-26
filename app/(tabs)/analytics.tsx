import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useMedicine } from "@/contexts/MedicineContext";
import { Colors } from "@/constants/colors";

function getShortDay(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" });
}

function BarChart({ data }: { data: { date: string; adherence: number }[] }) {
  const max = 100;

  return (
    <View style={chartStyles.container}>
      {data.map((item, i) => {
        const isToday = item.date === new Date().toISOString().split("T")[0];
        const barColor = item.adherence >= 80 ? Colors.taken : item.adherence >= 50 ? Colors.warning : item.adherence > 0 ? Colors.danger : Colors.border;
        const barHeight = Math.max((item.adherence / max) * 120, 4);

        return (
          <View key={item.date} style={chartStyles.barGroup}>
            <Text style={chartStyles.barPercent}>
              {item.adherence > 0 ? `${item.adherence}%` : ""}
            </Text>
            <View style={chartStyles.barTrack}>
              <View
                style={[
                  chartStyles.bar,
                  {
                    height: barHeight,
                    backgroundColor: barColor,
                    opacity: isToday ? 1 : 0.7,
                  },
                ]}
              />
            </View>
            <Text style={[chartStyles.barLabel, isToday && chartStyles.barLabelToday]}>
              {getShortDay(item.date)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 160,
    paddingTop: 20,
  },
  barGroup: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  barPercent: {
    fontSize: 10,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.textSecondary,
    height: 14,
  },
  barTrack: {
    flex: 1,
    width: "60%",
    justifyContent: "flex-end",
    borderRadius: 6,
    backgroundColor: Colors.borderLight,
    overflow: "hidden",
  },
  bar: {
    width: "100%",
    borderRadius: 6,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 11,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.textSecondary,
  },
  barLabelToday: {
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.primary,
  },
});

function StatCard({
  icon,
  label,
  value,
  subtitle,
  color,
  bgColor,
}: {
  icon: string;
  label: string;
  value: string | number;
  subtitle?: string;
  color: string;
  bgColor: string;
}) {
  return (
    <View style={[styles.statCard, { flex: 1 }]}>
      <View style={[styles.statIcon, { backgroundColor: bgColor }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {subtitle ? <Text style={styles.statSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export default function AnalyticsScreen() {
  const {
    getWeeklyAdherence,
    getDailyAdherence,
    getMissedCount,
    getTakenCount,
    logs,
    isLoading,
  } = useMedicine();

  const insets = useSafeAreaInsets();
  const weeklyData = getWeeklyAdherence();
  const todayAdherence = getDailyAdherence(new Date().toISOString().split("T")[0]);
  const missedCount = getMissedCount();
  const takenCount = getTakenCount();
  const totalLogs = logs.length;
  const overallAdherence = totalLogs > 0 ? Math.round((takenCount / totalLogs) * 100) : 0;

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
        <Text style={styles.headerTitle}>Analytics</Text>
        <Text style={styles.headerSubtitle}>Track your medication adherence</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={styles.heroCard}
        >
          <Text style={styles.heroLabel}>Overall Adherence</Text>
          <Text style={styles.heroValue}>{overallAdherence}%</Text>
          <View style={styles.heroTrack}>
            <View style={[styles.heroBar, { width: `${overallAdherence}%` }]} />
          </View>
          <Text style={styles.heroSub}>
            {takenCount} of {totalLogs} doses taken
          </Text>
        </LinearGradient>

        <View style={styles.statsRow}>
          <StatCard
            icon="checkmark-circle"
            label="Taken"
            value={takenCount}
            color={Colors.taken}
            bgColor={Colors.takenLight}
          />
          <StatCard
            icon="close-circle"
            label="Missed"
            value={missedCount}
            color={Colors.missed}
            bgColor={Colors.missedLight}
          />
          <StatCard
            icon="today"
            label="Today"
            value={`${todayAdherence}%`}
            color={Colors.primary}
            bgColor={Colors.primaryLight}
          />
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Weekly Overview</Text>
            <View style={styles.chartLegend}>
              <View style={[styles.legendDot, { backgroundColor: Colors.taken }]} />
              <Text style={styles.legendText}>Good</Text>
              <View style={[styles.legendDot, { backgroundColor: Colors.warning }]} />
              <Text style={styles.legendText}>Fair</Text>
              <View style={[styles.legendDot, { backgroundColor: Colors.danger }]} />
              <Text style={styles.legendText}>Poor</Text>
            </View>
          </View>
          <BarChart data={weeklyData} />
        </View>

        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Ionicons name="bulb-outline" size={20} color={Colors.warning} />
            <Text style={styles.insightTitle}>Insights</Text>
          </View>
          <View style={styles.insightList}>
            {overallAdherence >= 80 ? (
              <InsightItem
                icon="trophy"
                color={Colors.taken}
                text="Excellent adherence! Keep up the great work."
              />
            ) : overallAdherence >= 50 ? (
              <InsightItem
                icon="trending-up"
                color={Colors.warning}
                text="Good progress! Try to take medicines on time consistently."
              />
            ) : (
              <InsightItem
                icon="alert-circle"
                color={Colors.danger}
                text="Your adherence needs improvement. Set alarms to help remember."
              />
            )}
            {missedCount > 3 ? (
              <InsightItem
                icon="notifications"
                color={Colors.primary}
                text={`You've missed ${missedCount} doses. Consider enabling alarms.`}
              />
            ) : null}
            {takenCount === 0 ? (
              <InsightItem
                icon="medical"
                color={Colors.textSecondary}
                text="Start taking your medicines to see insights here."
              />
            ) : null}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

function InsightItem({ icon, color, text }: { icon: string; color: string; text: string }) {
  return (
    <View style={styles.insightItem}>
      <Ionicons name={icon as any} size={18} color={color} />
      <Text style={styles.insightText}>{text}</Text>
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
    gap: 14,
  },
  heroCard: {
    borderRadius: 20,
    padding: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  heroLabel: {
    fontSize: 13,
    fontFamily: "Nunito_600SemiBold",
    color: "rgba(255,255,255,0.75)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  heroValue: {
    fontSize: 56,
    fontFamily: "Nunito_800ExtraBold",
    color: "#fff",
    marginTop: 4,
  },
  heroTrack: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 4,
    marginTop: 8,
    overflow: "hidden",
  },
  heroBar: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 4,
  },
  heroSub: {
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
    color: "rgba(255,255,255,0.8)",
    marginTop: 8,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 6,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 22,
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.textSecondary,
  },
  statSubtitle: {
    fontSize: 11,
    fontFamily: "Nunito_400Regular",
    color: Colors.textTertiary,
  },
  chartCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  chartTitle: {
    fontSize: 17,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
  },
  chartLegend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontFamily: "Nunito_400Regular",
    color: Colors.textSecondary,
    marginRight: 4,
  },
  insightCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  insightTitle: {
    fontSize: 17,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
  },
  insightList: { gap: 12 },
  insightItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  insightText: {
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
});
