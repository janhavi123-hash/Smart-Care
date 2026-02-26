const primary = "#1A6FE8";
const primaryDark = "#1458C0";
const primaryLight = "#E8F0FD";
const success = "#22C55E";
const successLight = "#DCFCE7";
const warning = "#F59E0B";
const warningLight = "#FEF3C7";
const danger = "#EF4444";
const dangerLight = "#FEE2E2";

export const Colors = {
  primary,
  primaryDark,
  primaryLight,
  success,
  successLight,
  warning,
  warningLight,
  danger,
  dangerLight,

  background: "#F5F7FA",
  cardBackground: "#FFFFFF",
  text: "#1A1A2E",
  textSecondary: "#6B7280",
  textTertiary: "#9CA3AF",
  border: "#E5E7EB",
  borderLight: "#F3F4F6",

  tabBar: "#FFFFFF",
  tabBarActive: primary,
  tabBarInactive: "#9CA3AF",

  taken: success,
  takenLight: successLight,
  pending: primary,
  pendingLight: primaryLight,
  missed: danger,
  missedLight: dangerLight,
};

export default {
  light: {
    text: Colors.text,
    background: Colors.background,
    tint: primary,
    tabIconDefault: Colors.tabBarInactive,
    tabIconSelected: primary,
  },
};
