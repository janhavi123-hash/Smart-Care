import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useState, useRef } from "react";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";

let CameraView: any = null;
let useCameraPermissions: any = null;

if (Platform.OS !== "web") {
  const cam = require("expo-camera");
  CameraView = cam.CameraView;
  useCameraPermissions = cam.useCameraPermissions;
}

function WebFallback() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <View style={styles.webFallback}>
        <Ionicons name="barcode-outline" size={64} color={Colors.textSecondary} />
        <Text style={styles.webFallbackTitle}>Camera Not Available</Text>
        <Text style={styles.webFallbackText}>
          Barcode scanning is only available on mobile devices. Please use the Expo Go app to scan barcodes.
        </Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </Pressable>
      </View>
    </View>
  );
}

function BarcodeScanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const insets = useSafeAreaInsets();

  if (!permission) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <View style={styles.permissionView}>
          <Ionicons name="camera-outline" size={64} color={Colors.textSecondary} />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            SmartCare needs camera access to scan medicine barcodes.
          </Text>
          {!permission.granted && permission.canAskAgain ? (
            <Pressable style={styles.permissionBtn} onPress={requestPermission}>
              <Text style={styles.permissionBtnText}>Allow Camera</Text>
            </Pressable>
          ) : (
            <Text style={styles.permissionDenied}>
              Camera access was denied. Please enable it in Settings.
            </Text>
          )}
          <Pressable style={styles.cancelBtn} onPress={() => router.back()}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  function handleBarCodeScanned({ type, data }: { type: string; data: string }) {
    if (scanned) return;
    setScanned(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const medicineName = extractMedicineName(data);
    router.replace({
      pathname: "/(tabs)/add",
      params: { scannedName: medicineName },
    });
  }

  function extractMedicineName(barcodeData: string): string {
    const cleaned = barcodeData
      .replace(/[^a-zA-Z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return cleaned.split(" ").slice(0, 3).join(" ") || barcodeData;
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "ean13", "ean8", "code128", "code39", "upc_a", "upc_e"],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      <View style={[styles.overlay, { paddingTop: insets.top }]}>
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.overlayTitle}>Scan Barcode</Text>
        <Text style={styles.overlaySubtitle}>Point camera at medicine barcode</Text>
      </View>

      <View style={styles.scanFrame}>
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />
      </View>

      {scanned && (
        <View style={[styles.successOverlay, { paddingBottom: insets.bottom + 40 }]}>
          <Ionicons name="checkmark-circle" size={48} color={Colors.taken} />
          <Text style={styles.successText}>Barcode Detected!</Text>
          <Pressable style={styles.scanAgainBtn} onPress={() => setScanned(false)}>
            <Text style={styles.scanAgainText}>Scan Again</Text>
          </Pressable>
        </View>
      )}

      <View style={[styles.bottomHint, { paddingBottom: insets.bottom + 30 }]}>
        <Text style={styles.hintText}>
          Align barcode within the frame to scan automatically
        </Text>
      </View>
    </View>
  );
}

export default function BarcodeScanScreen() {
  if (Platform.OS === "web") return <WebFallback />;
  return <BarcodeScanner />;
}

const FRAME_SIZE = 240;
const CORNER_SIZE = 30;
const CORNER_WIDTH = 4;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  centerState: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingBottom: 20,
  },
  closeBtn: {
    position: "absolute",
    right: 20,
    top: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  overlayTitle: {
    fontSize: 22,
    fontFamily: "Nunito_800ExtraBold",
    color: "#fff",
    marginTop: 10,
  },
  overlaySubtitle: {
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  scanFrame: {
    position: "absolute",
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    top: "50%",
    left: "50%",
    marginTop: -FRAME_SIZE / 2,
    marginLeft: -FRAME_SIZE / 2,
  },
  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: "#fff",
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderBottomRightRadius: 4,
  },
  successOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.8)",
    alignItems: "center",
    padding: 30,
    gap: 10,
  },
  successText: {
    fontSize: 20,
    fontFamily: "Nunito_700Bold",
    color: "#fff",
  },
  scanAgainBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginTop: 4,
  },
  scanAgainText: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: "#fff",
  },
  bottomHint: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    padding: 20,
  },
  hintText: {
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
  },
  permissionView: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  permissionTitle: {
    fontSize: 22,
    fontFamily: "Nunito_700Bold",
    color: "#fff",
    textAlign: "center",
  },
  permissionText: {
    fontSize: 15,
    fontFamily: "Nunito_400Regular",
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    lineHeight: 22,
  },
  permissionBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 12,
    marginTop: 8,
  },
  permissionBtnText: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: "#fff",
  },
  permissionDenied: {
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
    color: Colors.danger,
    textAlign: "center",
  },
  cancelBtn: {
    marginTop: 8,
    padding: 12,
  },
  cancelBtnText: {
    fontSize: 16,
    fontFamily: "Nunito_600SemiBold",
    color: "rgba(255,255,255,0.7)",
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
