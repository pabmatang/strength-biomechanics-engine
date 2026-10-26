// Notification Service for CHΔNCE Gym App
// Manages browser notifications, daily reminders, and in-app alert status

export interface NotificationSettings {
  enabled: boolean;
  reminderTime: string; // "HH:MM" e.g. "21:00"
  lastNotifiedDate: string | null; // "YYYY-MM-DD"
  notifyWorkout: boolean;
  notifyMeals: boolean;
}

const STORAGE_KEY = 'chance_notification_settings';

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  reminderTime: '21:00',
  lastNotifiedDate: null,
  notifyWorkout: true,
  notifyMeals: true
};

export function getNotificationSettings(): NotificationSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_NOTIFICATION_SETTINGS;
    return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(saved) };
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

export function saveNotificationSettings(settings: NotificationSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {}
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return 'denied';
  }
}

export function sendLocalNotification(title: string, options?: NotificationOptions): boolean {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  try {
    new Notification(title, {
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      ...options
    });
    return true;
  } catch (err) {
    console.warn('[NotificationService] Error sending notification:', err);
    return false;
  }
}

export function checkAndTriggerDailyReminder(
  hasLoggedWorkoutToday: boolean,
  hasLoggedMealsToday: boolean
): { triggered: boolean; message?: string } {
  const settings = getNotificationSettings();
  if (!settings.enabled) return { triggered: false };

  const today = new Date().toISOString().split('T')[0];
  if (settings.lastNotifiedDate === today) {
    return { triggered: false };
  }

  // Parse target reminder time
  const [targetHour, targetMinute] = settings.reminderTime.split(':').map(Number);
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const isTimeReached = currentHour > targetHour || (currentHour === targetHour && currentMinute >= targetMinute);
  if (!isTimeReached) {
    return { triggered: false };
  }

  // Check if user still has pending entries today
  const workoutPending = settings.notifyWorkout && !hasLoggedWorkoutToday;
  const mealsPending = settings.notifyMeals && !hasLoggedMealsToday;

  if (!workoutPending && !mealsPending) {
    // Everything is logged! No need to disturb
    return { triggered: false };
  }

  let title = 'CHΔNCE • Recordatorio Diario';
  let body = '';

  if (workoutPending && mealsPending) {
    body = 'Recuerda registrar tu entrenamiento y tus comidas de hoy para mantener tus métricas al día.';
  } else if (workoutPending) {
    body = '¿Entrenaste hoy? Apunta tus series y cargas para no perder tu historial de progresión.';
  } else {
    body = 'Tienes comidas pendientes de registrar. Anota tus calorías y proteínas del día.';
  }

  // Send browser notification if permission granted
  const sent = sendLocalNotification(title, {
    body,
    tag: 'chance-daily-reminder'
  });

  // Mark as notified today
  saveNotificationSettings({
    ...settings,
    lastNotifiedDate: today
  });

  return { triggered: true, message: body };
}
