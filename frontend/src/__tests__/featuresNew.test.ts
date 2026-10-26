import { describe, it, expect, beforeEach } from 'vitest';

// Node environment localStorage mock
if (typeof localStorage === 'undefined') {
  let store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => { store[key] = String(val); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    key: (index: number) => Object.keys(store)[index] || null,
    get length() { return Object.keys(store).length; }
  };
}

import { 
  getNotificationSettings, 
  saveNotificationSettings, 
  checkAndTriggerDailyReminder, 
  DEFAULT_NOTIFICATION_SETTINGS 
} from '../utils/notificationService';

describe('Daily Notification & Reminder Service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('retrieves default notification settings when empty', () => {
    const settings = getNotificationSettings();
    expect(settings.enabled).toBe(true);
    expect(settings.reminderTime).toBe('21:00');
    expect(settings.notifyWorkout).toBe(true);
    expect(settings.notifyMeals).toBe(true);
  });

  it('saves and recovers custom reminder time and preferences', () => {
    saveNotificationSettings({
      ...DEFAULT_NOTIFICATION_SETTINGS,
      reminderTime: '20:30',
      notifyMeals: true,
      notifyWorkout: false
    });

    const loaded = getNotificationSettings();
    expect(loaded.reminderTime).toBe('20:30');
    expect(loaded.notifyWorkout).toBe(false);
  });

  it('does not trigger reminder if notifications are disabled', () => {
    saveNotificationSettings({
      ...DEFAULT_NOTIFICATION_SETTINGS,
      enabled: false
    });

    const result = checkAndTriggerDailyReminder(false, false);
    expect(result.triggered).toBe(false);
  });

  it('does not trigger reminder if everything has been logged today', () => {
    saveNotificationSettings({
      ...DEFAULT_NOTIFICATION_SETTINGS,
      enabled: true,
      reminderTime: '00:00' // Past time
    });

    const result = checkAndTriggerDailyReminder(true, true);
    expect(result.triggered).toBe(false);
  });
});
