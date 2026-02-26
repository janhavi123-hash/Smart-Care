import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Platform,
  Image,
  Alert,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Colors } from "@/constants/colors";

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : "http://localhost:5000";

function WebFallback() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + 20, backgroundColor: "#fff" }]}>
      <View style={styles.webFallback}>
        <Ionicons name="scan-outline" size={72} color={Colors.textSecondary} />
        <Text style={styles.webFallbackTitle}>Scan Not Available on Web</Text>
        <Text style={styles.webFallbackText}>
          Text scanning from medicine strips requires the Expo Go mobile app on your device.
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
  const [editedName, setEditedName] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  async function processImage(uri: string, base64: string) {
    setIsProcessing(true);
    setErrorMsg("");
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const response = await fetch(`${API_BASE}/api/ocr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      if (!response.ok) throw new Error("Server error");
      const data = await response.json();
      const name = data.medicineName ?? "Unknown";

      setEditedName(name === "Unknown" ? "" : name);
      setShowResult(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.error(e);
      setErrorMsg("Could not analyze the image. Please try again or type the name manually.");
      setShowResult(true);
      setEditedName("");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleCameraCapture() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow camera access to scan medicine labels.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setShowResult(false);
      processImage(asset.uri, asset.base64 ?? "");
    }
  }

  async function handleGalleryPick() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow photo library access.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setShowResult(false);
      processImage(asset.uri, asset.base64 ?? "");
    }
  }

  function handleConfirm() {
    if (editedName.trim()) {
      router.replace({
        pathname: "/(tabs)/add",
        params: { scannedText: editedName.trim() },
      });
    } else {
      Alert.alert("No name", "Please type the medicine name before confirming.");
    }
  }

  function handleRetry() {
    setShowResult(false);
    setImageUri(null);
    setEditedName("");
    setErrorMsg("");
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={26} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Scan Medicine Label</Text>
      </View>

      <View style={styles.content}>
        {!showResult && !isProcessing && (
          <>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
            ) : (
              <View style={styles.illustrationBox}>
                <Ionicons name="scan-outline" size={72} color={Colors.primary} />
                <Text style={styles.illustrationText}>AI will read the medicine name from your photo</Text>
              </View>
            )}

            <Text style={styles.instructionTitle}>Take a Clear Photo</Text>
            <Text style={styles.instructionText}>
              Point your camera at the medicine name on the strip, bottle, or packaging. Make sure the text is sharp and well lit.
            </Text>

            <View style={styles.actionBtns}>
              <Pressable
                style={({ pressed }) => [styles.mainBtn, pressed && { opacity: 0.88 }]}
                onPress={handleCameraCapture}
              >
                <Ionicons name="camera" size={26} color="#fff" />
                <Text style={styles.mainBtnText}>Take Photo</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.88 }]}
                onPress={handleGalleryPick}
              >
                <Ionicons name="images-outline" size={24} color={Colors.primary} />
                <Text style={styles.secondaryBtnText}>Choose from Gallery</Text>
              </Pressable>
            </View>
          </>
        )}

        {isProcessing && (
          <View style={styles.processingBox}>
            {imageUri && (
              <Image source={{ uri: imageUri }} style={styles.previewImageSmall} resizeMode="contain" />
            )}
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 24 }} />
            <Text style={styles.processingTitle}>Analyzing Image...</Text>
            <Text style={styles.processingText}>AI is reading the medicine label</Text>
          </View>
        )}

        {showResult && (
          <View style={styles.resultBox}>
            {imageUri && (
              <Image source={{ uri: imageUri }} style={styles.previewImageSmall} resizeMode="contain" />
            )}

            {errorMsg ? (
              <View style={styles.errorBanner}>
                <Ionicons name="warning-outline" size={20} color={Colors.danger} />
                <Text style={styles.errorBannerText}>{errorMsg}</Text>
              </View>
            ) : (
              <View style={styles.successBanner}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.taken} />
                <Text style={styles.successBannerText}>Medicine name detected!</Text>
              </View>
            )}

            <Text style={styles.resultLabel}>Medicine Name</Text>
            <Text style={styles.resultHint}>You can edit the name before confirming</Text>
            <TextInput
              style={styles.resultInput}
              value={editedName}
              onChangeText={setEditedName}
              placeholder="Type or edit medicine name..."
              placeholderTextColor={Colors.textTertiary}
              autoCapitalize="words"
              autoFocus
            />

            <Pressable
              style={({ pressed }) => [styles.confirmBtn, pressed && { opacity: 0.88 }]}
              onPress={handleConfirm}
            >
              <Ionicons name="checkmark" size={22} color="#fff" />
              <Text style={styles.confirmBtnText}>Use This Name</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.88 }]}
              onPress={handleRetry}
            >
              <Ionicons name="refresh" size={20} color={Colors.primary} />
              <Text style={styles.retryBtnText}>Scan Again</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

export default function OCRScreen() {
  if (Platform.OS === "web") return <WebFallback />;
  return <OCRScanner />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: 12,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.text,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: "center",
  },
  illustrationBox: {
    width: "100%",
    height: 180,
    backgroundColor: Colors.primaryLight,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    gap: 12,
  },
  illustrationText: {
    fontSize: 16,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.primary,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: Colors.borderLight,
  },
  previewImageSmall: {
    width: "100%",
    height: 140,
    borderRadius: 14,
    marginBottom: 16,
    backgroundColor: Colors.borderLight,
  },
  instructionTitle: {
    fontSize: 22,
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.text,
    textAlign: "center",
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 17,
    fontFamily: "Nunito_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 26,
    marginBottom: 32,
  },
  actionBtns: { width: "100%", gap: 12 },
  mainBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 60,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  mainBtnText: {
    fontSize: 19,
    fontFamily: "Nunito_700Bold",
    color: "#fff",
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.primaryLight,
    borderRadius: 16,
    height: 56,
    borderWidth: 1.5,
    borderColor: Colors.primary + "40",
  },
  secondaryBtnText: {
    fontSize: 17,
    fontFamily: "Nunito_700Bold",
    color: Colors.primary,
  },
  processingBox: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  processingTitle: {
    fontSize: 22,
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.text,
    marginTop: 20,
    textAlign: "center",
  },
  processingText: {
    fontSize: 16,
    fontFamily: "Nunito_400Regular",
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: "center",
  },
  resultBox: {
    width: "100%",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.dangerLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.danger,
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.successLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  successBannerText: {
    fontSize: 15,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.taken,
  },
  resultLabel: {
    fontSize: 18,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
    marginBottom: 4,
  },
  resultHint: {
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  resultInput: {
    backgroundColor: Colors.borderLight,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.primary,
    paddingHorizontal: 16,
    height: 56,
    fontSize: 18,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.text,
    marginBottom: 16,
  },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 58,
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  confirmBtnText: {
    fontSize: 19,
    fontFamily: "Nunito_700Bold",
    color: "#fff",
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    height: 52,
    borderWidth: 1.5,
    borderColor: Colors.primary + "40",
  },
  retryBtnText: {
    fontSize: 17,
    fontFamily: "Nunito_700Bold",
    color: Colors.primary,
  },
  webFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
  webFallbackTitle: {
    fontSize: 24,
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.text,
    textAlign: "center",
  },
  webFallbackText: {
    fontSize: 17,
    fontFamily: "Nunito_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 26,
  },
  backBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 8,
  },
  backBtnText: {
    fontSize: 17,
    fontFamily: "Nunito_700Bold",
    color: "#fff",
  },
});
