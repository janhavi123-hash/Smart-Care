import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";

function generateId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export type MedicationStatus = "taken" | "missed" | "pending";

export interface Medicine {
  id: string;
  userId: string;
  name: string;
  dosage: string;
  time: string;
  startDate: string;
  endDate: string;
  alarmEnabled: boolean;
  createdAt: string;
}

export interface MedicationLog {
  id: string;
  medicineId: string;
  userId: string;
  date: string;
  status: MedicationStatus;
  scheduledTime: string;
  medicineName: string;
  dosage: string;
}

interface MedicineContextValue {
  medicines: Medicine[];
  logs: MedicationLog[];
  isLoading: boolean;
  addMedicine: (data: Omit<Medicine, "id" | "userId" | "createdAt">) => Promise<void>;
  updateMedicine: (id: string, data: Partial<Medicine>) => Promise<void>;
  deleteMedicine: (id: string) => Promise<void>;
  updateLogStatus: (logId: string, status: MedicationStatus) => Promise<void>;
  getTodayMedicines: () => { medicine: Medicine; log: MedicationLog }[];
  getNextReminder: () => { medicine: Medicine; log: MedicationLog; minutesUntil: number } | null;
  getDailyAdherence: (date: string) => number;
  getWeeklyAdherence: () => { date: string; adherence: number }[];
  getMissedCount: () => number;
  getTakenCount: () => number;
  refreshLogs: () => Promise<void>;
}

const MedicineContext = createContext<MedicineContextValue | null>(null);

const KEYS = {
  MEDICINES: (uid: string) => `smartcare_medicines_${uid}`,
  LOGS: (uid: string) => `smartcare_logs_${uid}`,
};

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

async function syncLogsHelper(
  meds: Medicine[],
  existingLogs: MedicationLog[],
  userId: string,
): Promise<MedicationLog[]> {
  const today = getTodayStr();
  const now = new Date();
  let changed = false;

  const newLogs = existingLogs.map((log) => {
    if (log.date === today && log.status === "pending") {
      const [h, m] = log.scheduledTime.split(":").map(Number);
      const scheduled = new Date();
      scheduled.setHours(h, m, 0, 0);
      if (now > scheduled) {
        changed = true;
        return { ...log, status: "missed" as const };
      }
    }
    return log;
  });

  for (const med of meds) {
    if (med.startDate <= today && med.endDate >= today) {
      const has = newLogs.some(
        (l) => l.medicineId === med.id && l.date === today,
      );
      if (!has) {
        const [h, m] = med.time.split(":").map(Number);
        const scheduled = new Date();
        scheduled.setHours(h, m, 0, 0);
        newLogs.push({
          id: generateId(),
          medicineId: med.id,
          userId,
          date: today,
          status: now > scheduled ? "missed" : "pending",
          scheduledTime: med.time,
          medicineName: med.name,
          dosage: med.dosage,
        });
        changed = true;
      }
    }
  }

  if (changed) {
    await AsyncStorage.setItem(KEYS.LOGS(userId), JSON.stringify(newLogs));
  }
  return newLogs;
}

function getDatesBetween(start: string, end: string): string[] {
  const dates: string[] = [];
  const s = new Date(start);
  const e = new Date(end);
  const now = new Date();
  const cur = new Date(s);
  while (cur <= e && cur <= now) {
    dates.push(cur.toISOString().split("T")[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export function MedicineProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setMedicines([]);
      setLogs([]);
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const userId = user.id;
    const interval = setInterval(async () => {
      try {
        const medsRaw = await AsyncStorage.getItem(KEYS.MEDICINES(userId));
        const logsRaw = await AsyncStorage.getItem(KEYS.LOGS(userId));
        const latestMeds: Medicine[] = medsRaw ? JSON.parse(medsRaw) : [];
        const latestLogs: MedicationLog[] = logsRaw ? JSON.parse(logsRaw) : [];
        const synced = await syncLogsHelper(latestMeds, latestLogs, userId);
        setLogs(synced);
      } catch (e) {
        console.error("Auto-sync error", e);
      }
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.id]);

  async function loadData() {
    if (!user) return;
    setIsLoading(true);
    try {
      const meds = await AsyncStorage.getItem(KEYS.MEDICINES(user.id));
      const logsData = await AsyncStorage.getItem(KEYS.LOGS(user.id));
      const loadedMeds: Medicine[] = meds ? JSON.parse(meds) : [];
      const loadedLogs: MedicationLog[] = logsData ? JSON.parse(logsData) : [];
      setMedicines(loadedMeds);
      const syncedLogs = await syncLogsForToday(loadedMeds, loadedLogs);
      setLogs(syncedLogs);
    } catch (e) {
      console.error("Failed to load medicine data", e);
    } finally {
      setIsLoading(false);
    }
  }

  async function syncLogsForToday(meds: Medicine[], existingLogs: MedicationLog[]): Promise<MedicationLog[]> {
    if (!user) return existingLogs;
    return syncLogsHelper(meds, existingLogs, user.id);
  }

  async function refreshLogs() {
    if (!user) return;
    const synced = await syncLogsHelper(medicines, logs, user.id);
    setLogs(synced);
  }

  async function saveMedicines(updated: Medicine[]) {
    if (!user) return;
    await AsyncStorage.setItem(KEYS.MEDICINES(user.id), JSON.stringify(updated));
    setMedicines(updated);
  }

  async function saveLogs(updated: MedicationLog[]) {
    if (!user) return;
    await AsyncStorage.setItem(KEYS.LOGS(user.id), JSON.stringify(updated));
    setLogs(updated);
  }

  async function addMedicine(data: Omit<Medicine, "id" | "userId" | "createdAt">) {
    if (!user) return;
    const med: Medicine = {
      ...data,
      id: generateId(),
      userId: user.id,
      createdAt: new Date().toISOString(),
    };
    const updated = [...medicines, med];
    await saveMedicines(updated);

    const today = getTodayStr();
    if (med.startDate <= today && med.endDate >= today) {
      const now = new Date();
      const [h, m] = med.time.split(":").map(Number);
      const scheduled = new Date();
      scheduled.setHours(h, m, 0, 0);
      const newLog: MedicationLog = {
        id: generateId(),
        medicineId: med.id,
        userId: user.id,
        date: today,
        status: now > scheduled ? "missed" : "pending",
        scheduledTime: med.time,
        medicineName: med.name,
        dosage: med.dosage,
      };
      await saveLogs([...logs, newLog]);
    }
  }

  async function updateMedicine(id: string, data: Partial<Medicine>) {
    const updated = medicines.map((m) => (m.id === id ? { ...m, ...data } : m));
    await saveMedicines(updated);

    const updatedLogs = logs.map((l) =>
      l.medicineId === id
        ? {
            ...l,
            medicineName: data.name ?? l.medicineName,
            dosage: data.dosage ?? l.dosage,
            scheduledTime: data.time ?? l.scheduledTime,
          }
        : l
    );
    await saveLogs(updatedLogs);
  }

  async function deleteMedicine(id: string) {
    const updated = medicines.filter((m) => m.id !== id);
    await saveMedicines(updated);
    const updatedLogs = logs.filter((l) => l.medicineId !== id);
    await saveLogs(updatedLogs);
  }

  async function updateLogStatus(logId: string, status: MedicationStatus) {
    const updated = logs.map((l) => (l.id === logId ? { ...l, status } : l));
    await saveLogs(updated);
  }

  const getTodayMedicines = useCallback((): { medicine: Medicine; log: MedicationLog }[] => {
    const today = getTodayStr();
    const todayLogs = logs.filter((l) => l.date === today);
    return todayLogs
      .map((log) => {
        const medicine = medicines.find((m) => m.id === log.medicineId);
        if (!medicine) return null;
        return { medicine, log };
      })
      .filter(Boolean) as { medicine: Medicine; log: MedicationLog }[];
  }, [medicines, logs]);

  const getNextReminder = useCallback((): { medicine: Medicine; log: MedicationLog; minutesUntil: number } | null => {
    const today = getTodayStr();
    const now = new Date();
    const pending = logs
      .filter((l) => l.date === today && l.status === "pending")
      .map((log) => {
        const medicine = medicines.find((m) => m.id === log.medicineId);
        if (!medicine) return null;
        const [h, m] = log.scheduledTime.split(":").map(Number);
        const scheduled = new Date();
        scheduled.setHours(h, m, 0, 0);
        const minutesUntil = Math.round((scheduled.getTime() - now.getTime()) / 60000);
        return { medicine, log, minutesUntil };
      })
      .filter((x): x is { medicine: Medicine; log: MedicationLog; minutesUntil: number } => x !== null && x.minutesUntil > 0)
      .sort((a, b) => a.minutesUntil - b.minutesUntil);

    return pending[0] ?? null;
  }, [medicines, logs]);

  const getDailyAdherence = useCallback((date: string): number => {
    const dayLogs = logs.filter((l) => l.date === date);
    if (dayLogs.length === 0) return 0;
    const taken = dayLogs.filter((l) => l.status === "taken").length;
    return Math.round((taken / dayLogs.length) * 100);
  }, [logs]);

  const getWeeklyAdherence = useCallback((): { date: string; adherence: number }[] => {
    const result: { date: string; adherence: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const date = d.toISOString().split("T")[0];
      result.push({ date, adherence: getDailyAdherence(date) });
    }
    return result;
  }, [getDailyAdherence]);

  const getMissedCount = useCallback((): number => {
    return logs.filter((l) => l.status === "missed").length;
  }, [logs]);

  const getTakenCount = useCallback((): number => {
    return logs.filter((l) => l.status === "taken").length;
  }, [logs]);

  const value = useMemo(
    () => ({
      medicines,
      logs,
      isLoading,
      addMedicine,
      updateMedicine,
      deleteMedicine,
      updateLogStatus,
      getTodayMedicines,
      getNextReminder,
      getDailyAdherence,
      getWeeklyAdherence,
      getMissedCount,
      getTakenCount,
      refreshLogs,
    }),
    [medicines, logs, isLoading],
  );

  return (
    <MedicineContext.Provider value={value}>{children}</MedicineContext.Provider>
  );
}

export function useMedicine() {
  const ctx = useContext(MedicineContext);
  if (!ctx) throw new Error("useMedicine must be used within MedicineProvider");
  return ctx;
}
