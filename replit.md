# SmartCare – Elderly Medicine Reminder App

## Overview
A comprehensive, elder-friendly mobile medicine reminder app built with Expo React Native and an Express backend.

## Architecture
- **Frontend**: Expo Router (file-based routing), React Native
- **Backend**: Express.js + TypeScript on port 5000
- **Storage**: AsyncStorage for local data persistence
- **State**: React Context (AuthContext, MedicineContext)
- **Fonts**: Nunito from @expo-google-fonts/nunito

## Key Features
1. **Authentication** – Local email/password auth via AsyncStorage (no Firebase needed)
2. **Home Screen** – Greeting, next reminder countdown card, today's medication list with Taken/Pending actions
3. **Add Medicine** – Name, dosage picker, time picker, start/end dates, alarm toggle, barcode scanner, OCR text scanner
4. **History** – Medication logs with date grouping, filter by status (All/Taken/Missed/Pending)
5. **Analytics** – Overall adherence %, weekly bar chart, insights
6. **Settings** – Edit name, caregiver details, emergency SMS alert, manage medicines, logout
7. **Barcode Scanner** – expo-camera barcode scanning (iOS/Android only)
8. **OCR Scanner** – expo-image-picker + text extraction (iOS/Android only)

## File Structure
```
app/
  _layout.tsx          # Root layout with AuthProvider, MedicineProvider, font loading
  (auth)/
    _layout.tsx        # Auth stack
    login.tsx          # Login screen
    register.tsx       # Register screen
  (tabs)/
    _layout.tsx        # Tab bar with NativeTabs (iOS 26 liquid glass) or ClassicTabs
    index.tsx          # Home screen
    add.tsx            # Add medicine screen
    history.tsx        # Medication history
    analytics.tsx      # Health analytics charts
    settings.tsx       # Profile & settings
  scan/
    barcode.tsx        # Barcode scanner screen
    ocr.tsx            # OCR text scanner screen

contexts/
  AuthContext.tsx      # User profile state, login/register/logout
  MedicineContext.tsx  # Medicines + logs CRUD, adherence calculations

constants/
  colors.ts            # App color palette (blue primary theme)
```

## Color Theme
- Primary: #1A6FE8 (blue)
- Success: #22C55E (green)
- Danger: #EF4444 (red)
- Warning: #F59E0B (amber)
- Background: #F5F7FA

## Data Models
- **Medicine**: id, userId, name, dosage, time, startDate, endDate, alarmEnabled, createdAt
- **MedicationLog**: id, medicineId, userId, date, status (taken/missed/pending), scheduledTime, medicineName, dosage
- **UserProfile**: id, name, email, caregiverName, caregiverPhone

## Workflows
- **Start Backend**: `npm run server:dev` – Express on port 5000
- **Start Frontend**: `npm run expo:dev` – Expo on port 8081
