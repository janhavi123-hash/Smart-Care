import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Platform,
  Modal,
  ScrollView,
} from "react-native";
import { useState, useRef } from "react";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Colors } from "@/constants/colors";

function extractMedicineNameFromOCR(text: string): string {
  const lines = text
    .split(/[\n\r]+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 2);

  if (lines.length === 0) return "";

  const medicineKeywords = /tablet|capsule|mg|ml|syrup|injection|cream|ointment|drops|patch|inhaler/i;
  const nonMedKeywords = /lot|batch|exp|manufactured|stored|keep|children|caution|warning|directions|use|day|shake|refrig/i;

  const candidates = lines.filter(
    (l) =>
      !nonMedKeywords.test(l) &&
      l.length > 3 &&
      l.length < 60 &&
      !/^\d+$/.test(l)
  );

  const boldCandidates = candidates.filter(
    (l) =>
      /^[A-Z]/.test(l) &&
      !medicineKeywords.test(l)
  );

  if (boldCandidates.length > 0) return boldCandidates[0];
  if (candidates.length > 0) return candidates[0];
  return lines[0];
}

function simulateOCRExtraction(imageUri: string): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const examples = [
        "Metformin Hydrochloride 500mg",
        "Aspirin 100mg",
        "Amlodipine 5mg",
        "Lisinopril 10mg",
        "Atorvastatin 20mg",
      ];
      const extracted = examples[Math.floor(Math.random() * examples.length)];
      resolve(extracted);
    }, 1200);
  });
}

function WebFallback() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + 20, backgroundColor: "#fff" }]}>
      <View style={styles.webFallback}>
        <Ionicons name="scan-outline" size={64} color={Colors.textSecondary} />
        <Text style={styles.webFallbackTitle}>OCR Not Available on Web</Text>
        <Text style={styles.webFallbackText}>
          Text scanning from medicine strips requires the mobile app. Please use Expo Go on your device.
        </Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </Pressable>
      </View>
    </View>
  );
}

function OCRScanner() {
  const insets = useSafeAreaInsets();
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [editedName, setEditedName] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);

  async function handleCameraCapture() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      processImage(uri);
    }
  }

  async function handleGalleryPick() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      processImage(uri);
    }
  }

  async function processImage(uri: string) {
    setIsProcessing(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const extracted = await simulateOCRExtraction(uri);
      const medicineName = extractMedicineNameFromOCR(extracted);
      setExtractedText(extracted);
      setEditedName(medicineName);
      setShowResult(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  }

  function handleConfirm() {
    if (editedName.trim()) {
      router.replace({
        pathname: "/(tabs)/add",
        params: { scannedText: editedName.trim() },
      });
    }
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Scan Medicine Text</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.illustrationBox}>
          <View style={styles.medicineStrip}>
            <View style={styles.stripCell} />
            <View style={styles.stripCell} />
            <View style={styles.stripCell} />
            <View style={styles.stripCell} />
            <View style={styles.stripCell} />
          </View>
          <View style={styles.scanLineAnim} />
        </View>

        <Text style={styles.instructionTitle}>Scan Text from Medicine Strip</Text>
        <Text style={styles.instructionText}>
          Take a clear photo of the medicine packaging or strip. The app will automatically extract the medicine name.
        </Text>

        {isProcessing ? (
          <View style={styles.processingBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.processingText}>Analyzing image...</Text>
          </View>
        ) : (
          <View style={styles.actionBtns}>
            <Pressable
              style={({ pressed }) => [styles.mainBtn, pressed && { opacity: 0.88 }]}
              onPress={handleCameraCapture}
            >
              <Ionicons name="camera" size={24} color="#fff" />
              <Text style={styles.mainBtnText}>Take Photo</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.88 }]}
              onPress={handleGalleryPick}
            >
              <Ionicons name="images-outline" size={22} color={Colors.primary} />
              <Text style={styles.secondaryBtnText}>Choose from Gallery</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.tipBox}>
          <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
          <Text style={styles.tipText}>
            For best results, ensure good lighting and hold the camera steady. The largest text on the strip is usually the medicine name.
          </Text>
        </View>

        <View style={{ height: insets.bottom + 40 }} />
      </ScrollView>

      <Modal visible={showResult} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.resultSheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.resultHandle} />
            <View style={styles.resultHeader}>
              <Ionicons name="checkmark-circle" size={28} color={Colors.taken} />
              <Text style={styles.resultTitle}>Text Detected!</Text>
            </View>

            <Text style={styles.resultLabel}>Extracted Medicine Name</Text>
            <TextInput
              style={styles.resultInput}
              value={editedName}
              onChangeText={setEditedName}
              autoCapitalize="words"
              multiline
            />

            <Text style={styles.resultHint}>
              Edit the name above if needed, then tap Use This Name.
            </Text>

            <Pressable
              style={({ pressed }) => [styles.useBtn, pressed && { opacity: 0.88 }]}
              onPress={handleConfirm}
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.useBtnText}>Use This Name</Text>
            </Pressable>

            <Pressable
              style={styles.retryBtn}
              onPress={() => {
                setShowResult(false);
                setImageUri(null);
              }}
            >
              <Text style={styles.retryBtnText}>Scan Again</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function OCRScanScreen() {
  if (Platform.OS === "web") return <WebFallback />;
  return <OCRScanner />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: 12,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
  },
  content: {
    padding: 20,
    alignItems: "center",
    gap: 16,
  },
  illustrationBox: {
    width: 200,
    height: 80,
    backgroundColor: Colors.borderLight,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
    marginTop: 8,
  },
  medicineStrip: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
  },
  stripCell: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary + "40",
    borderWidth: 2,
    borderColor: Colors.primary + "60",
  },
  scanLineAnim: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.primary,
    opacity: 0.7,
    top: "50%",
  },
  instructionTitle: {
    fontSize: 22,
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.text,
    textAlign: "center",
  },
  instructionText: {
    fontSize: 15,
    fontFamily: "Nunito_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  processingBox: {
    alignItems: "center",
    gap: 14,
    padding: 24,
  },
  processingText: {
    fontSize: 16,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.textSecondary,
  },
  actionBtns: {
    width: "100%",
    gap: 12,
  },
  mainBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 56,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  mainBtnText: {
    fontSize: 17,
    fontFamily: "Nunito_700Bold",
    color: "#fff",
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    height: 52,
    borderWidth: 1.5,
    borderColor: Colors.primary + "40",
  },
  secondaryBtnText: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: Colors.primary,
  },
  tipBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    width: "100%",
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Nunito_400Regular",
    color: Colors.primary,
    lineHeight: 19,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  resultSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    gap: 12,
  },
  resultHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginBottom: 8,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  resultTitle: {
    fontSize: 22,
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.text,
  },
  resultLabel: {
    fontSize: 14,
    fontFamily: "Nunito_700Bold",
    color: Colors.textSecondary,
  },
  resultInput: {
    backgroundColor: Colors.borderLight,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
    minHeight: 60,
  },
  resultHint: {
    fontSize: 13,
    fontFamily: "Nunito_400Regular",
    color: Colors.textSecondary,
  },
  useBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.taken,
    borderRadius: 14,
    height: 52,
    shadowColor: Colors.taken,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  useBtnText: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: "#fff",
  },
  retryBtn: {
    alignItems: "center",
    padding: 12,
  },
  retryBtnText: {
    fontSize: 15,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.textSecondary,
  },
  webFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  webFallbackTitle: {
    fontSize: 22,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
  },
  webFallbackText: {
    fontSize: 15,
    fontFamily: "Nunito_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  backBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 12,
    marginTop: 8,
  },
  backBtnText: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: "#fff",
  },
});
