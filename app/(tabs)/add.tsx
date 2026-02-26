import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Switch,
  ActivityIndicator,
  Platform,
  Modal,
  FlatList,
} from "react-native";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useMedicine } from "@/contexts/MedicineContext";
import { Colors } from "@/constants/colors";

function today() {
  return new Date().toISOString().split("T")[0];
}

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

const DURATION_OPTIONS = [
  { label: "7 Days", days: 7 },
  { label: "14 Days", days: 14 },
  { label: "30 Days", days: 30 },
  { label: "90 Days", days: 90 },
  { label: "Custom", days: -1 },
];

const DOSAGE_OPTIONS = ["1 tablet", "2 tablets", "5 mg", "10 mg", "25 mg", "50 mg", "100 mg", "200 mg", "500 mg", "1 capsule", "2 capsules", "5 ml", "10 ml", "15 ml"];

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);
const MIN_OPTIONS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

export default function AddMedicineScreen() {
  const { addMedicine } = useMedicine();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ scannedName?: string; scannedText?: string }>();

  const [name, setName] = useState(params.scannedName ?? params.scannedText ?? "");
  const [dosage, setDosage] = useState("1 tablet");
  const [timeHour, setTimeHour] = useState(8);
  const [timeMin, setTimeMin] = useState(0);
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState(addDays(today(), 30));
  const [alarmEnabled, setAlarmEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [showDosagePicker, setShowDosagePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDurationPicker, setShowDurationPicker] = useState(false);

  const timeStr = `${timeHour.toString().padStart(2, "0")}:${timeMin.toString().padStart(2, "0")}`;
  const ampm = timeHour >= 12 ? "PM" : "AM";
  const displayHour = timeHour % 12 || 12;
  const displayTime = `${displayHour}:${timeMin.toString().padStart(2, "0")} ${ampm}`;

  async function handleSave() {
    if (!name.trim()) {
      setError("Medicine name is required");
      return;
    }
    setError("");
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await addMedicine({
        name: name.trim(),
        dosage,
        time: timeStr,
        startDate,
        endDate,
        alarmEnabled,
      });
      setSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        setSuccess(false);
        setName("");
        setDosage("1 tablet");
        setTimeHour(8);
        setTimeMin(0);
        setStartDate(today());
        setEndDate(addDays(today(), 30));
      }, 1500);
    } catch (e: any) {
      setError(e.message ?? "Failed to save medicine");
    } finally {
      setIsLoading(false);
    }
  }

  function selectDuration(days: number) {
    if (days === -1) {
      setShowDurationPicker(false);
      return;
    }
    setEndDate(addDays(startDate, days));
    setShowDurationPicker(false);
  }

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) },
        ]}
      >
        <Text style={styles.headerTitle}>Add Medicine</Text>
        <Text style={styles.headerSubtitle}>Fill in the details below</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={Colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {success ? (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.taken} />
            <Text style={styles.successText}>Medicine added successfully!</Text>
          </View>
        ) : null}

        <SectionCard title="Medicine Name" icon="medkit-outline">
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Metformin, Aspirin"
            placeholderTextColor={Colors.textTertiary}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          <View style={styles.scanRow}>
            <Pressable
              style={styles.scanBtn}
              onPress={() => router.push("/scan/barcode")}
            >
              <Ionicons name="barcode-outline" size={20} color={Colors.primary} />
              <Text style={styles.scanBtnText}>Scan Barcode</Text>
            </Pressable>
            <Pressable
              style={styles.scanBtn}
              onPress={() => router.push("/scan/ocr")}
            >
              <Ionicons name="scan-outline" size={20} color={Colors.primary} />
              <Text style={styles.scanBtnText}>Scan Text</Text>
            </Pressable>
          </View>
        </SectionCard>

        <SectionCard title="Dosage" icon="flask-outline">
          <Pressable
            style={styles.selectRow}
            onPress={() => setShowDosagePicker(true)}
          >
            <Text style={styles.selectText}>{dosage}</Text>
            <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
          </Pressable>
        </SectionCard>

        <SectionCard title="Reminder Time" icon="alarm-outline">
          <Pressable
            style={styles.selectRow}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={styles.selectText}>{displayTime}</Text>
            <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
          </Pressable>
        </SectionCard>

        <SectionCard title="Duration" icon="calendar-outline">
          <Pressable
            style={[styles.selectRow, { marginBottom: 8 }]}
            onPress={() => setShowDurationPicker(true)}
          >
            <Text style={styles.selectText}>Quick Select</Text>
            <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
          </Pressable>
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>Start Date</Text>
              <TextInput
                style={styles.dateInput}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>
            <Ionicons name="arrow-forward" size={16} color={Colors.textTertiary} style={{ marginTop: 20 }} />
            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>End Date</Text>
              <TextInput
                style={styles.dateInput}
                value={endDate}
                onChangeText={setEndDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>
          </View>
        </SectionCard>

        <SectionCard title="Alarm" icon="notifications-outline">
          <View style={styles.alarmRow}>
            <View>
              <Text style={styles.alarmLabel}>Enable Alarm</Text>
              <Text style={styles.alarmSub}>Get notified at reminder time</Text>
            </View>
            <Switch
              value={alarmEnabled}
              onValueChange={setAlarmEnabled}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </SectionCard>

        <Pressable
          style={({ pressed }) => [
            styles.saveBtn,
            pressed && styles.saveBtnPressed,
            isLoading && styles.saveBtnDisabled,
          ]}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>Save Medicine</Text>
            </>
          )}
        </Pressable>

        <View style={{ height: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 40 }} />
      </ScrollView>

      <Modal visible={showDosagePicker} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowDosagePicker(false)}>
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHandle} />
            <Text style={styles.pickerTitle}>Select Dosage</Text>
            <FlatList
              data={DOSAGE_OPTIONS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.pickerItem, dosage === item && styles.pickerItemActive]}
                  onPress={() => { setDosage(item); setShowDosagePicker(false); }}
                >
                  <Text style={[styles.pickerItemText, dosage === item && styles.pickerItemTextActive]}>
                    {item}
                  </Text>
                  {dosage === item && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>

      <Modal visible={showTimePicker} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowTimePicker(false)}>
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHandle} />
            <Text style={styles.pickerTitle}>Select Time</Text>
            <View style={styles.timePickerRow}>
              <View style={styles.timeColumn}>
                <Text style={styles.timeColumnLabel}>Hour</Text>
                <FlatList
                  data={HOUR_OPTIONS}
                  keyExtractor={(item) => item.toString()}
                  style={{ maxHeight: 200 }}
                  renderItem={({ item }) => {
                    const active = timeHour === item;
                    const lbl = item % 12 === 0 ? 12 : item % 12;
                    const ap = item >= 12 ? "PM" : "AM";
                    return (
                      <Pressable
                        style={[styles.timeItem, active && styles.timeItemActive]}
                        onPress={() => setTimeHour(item)}
                      >
                        <Text style={[styles.timeItemText, active && styles.timeItemTextActive]}>
                          {lbl} {ap}
                        </Text>
                      </Pressable>
                    );
                  }}
                />
              </View>
              <View style={styles.timeColumn}>
                <Text style={styles.timeColumnLabel}>Minute</Text>
                <FlatList
                  data={MIN_OPTIONS}
                  keyExtractor={(item) => item.toString()}
                  style={{ maxHeight: 200 }}
                  renderItem={({ item }) => {
                    const active = timeMin === item;
                    return (
                      <Pressable
                        style={[styles.timeItem, active && styles.timeItemActive]}
                        onPress={() => setTimeMin(item)}
                      >
                        <Text style={[styles.timeItemText, active && styles.timeItemTextActive]}>
                          :{item.toString().padStart(2, "0")}
                        </Text>
                      </Pressable>
                    );
                  }}
                />
              </View>
            </View>
            <Pressable
              style={styles.pickerDoneBtn}
              onPress={() => setShowTimePicker(false)}
            >
              <Text style={styles.pickerDoneText}>Done</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={showDurationPicker} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowDurationPicker(false)}>
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHandle} />
            <Text style={styles.pickerTitle}>Select Duration</Text>
            {DURATION_OPTIONS.map((opt) => (
              <Pressable
                key={opt.label}
                style={styles.pickerItem}
                onPress={() => selectDuration(opt.days)}
              >
                <Text style={styles.pickerItemText}>{opt.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionCardHeader}>
        <Ionicons name={icon as any} size={18} color={Colors.primary} />
        <Text style={styles.sectionCardTitle}>{title}</Text>
      </View>
      {children}
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
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dangerLight,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.danger,
    flex: 1,
  },
  successBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.successLight,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  successText: {
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.taken,
    flex: 1,
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionCardTitle: {
    fontSize: 15,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
  },
  textInput: {
    backgroundColor: Colors.borderLight,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 16,
    fontFamily: "Nunito_400Regular",
    color: Colors.text,
    marginBottom: 10,
  },
  scanRow: {
    flexDirection: "row",
    gap: 10,
  },
  scanBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary + "40",
    paddingVertical: 10,
  },
  scanBtnText: {
    fontSize: 13,
    fontFamily: "Nunito_700Bold",
    color: Colors.primary,
  },
  selectRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.borderLight,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    height: 48,
  },
  selectText: {
    fontSize: 16,
    fontFamily: "Nunito_400Regular",
    color: Colors.text,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dateField: { flex: 1 },
  dateLabel: {
    fontSize: 12,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  dateInput: {
    backgroundColor: Colors.borderLight,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    height: 44,
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
    color: Colors.text,
  },
  alarmRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  alarmLabel: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
  },
  alarmSub: {
    fontSize: 13,
    fontFamily: "Nunito_400Regular",
    color: Colors.textSecondary,
    marginTop: 2,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 56,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    marginTop: 4,
  },
  saveBtnPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    fontSize: 17,
    fontFamily: "Nunito_700Bold",
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  pickerSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "70%",
  },
  pickerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginBottom: 16,
  },
  pickerTitle: {
    fontSize: 18,
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.text,
    marginBottom: 12,
  },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  pickerItemActive: { backgroundColor: Colors.primaryLight, borderRadius: 10 },
  pickerItemText: {
    fontSize: 16,
    fontFamily: "Nunito_400Regular",
    color: Colors.text,
  },
  pickerItemTextActive: {
    fontFamily: "Nunito_700Bold",
    color: Colors.primary,
  },
  timePickerRow: {
    flexDirection: "row",
    gap: 16,
  },
  timeColumn: { flex: 1 },
  timeColumnLabel: {
    fontSize: 13,
    fontFamily: "Nunito_700Bold",
    color: Colors.textSecondary,
    marginBottom: 8,
    textAlign: "center",
  },
  timeItem: {
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
    marginBottom: 4,
  },
  timeItemActive: { backgroundColor: Colors.primaryLight },
  timeItemText: {
    fontSize: 15,
    fontFamily: "Nunito_400Regular",
    color: Colors.text,
  },
  timeItemTextActive: {
    fontFamily: "Nunito_700Bold",
    color: Colors.primary,
  },
  pickerDoneBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  pickerDoneText: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: "#fff",
  },
});
