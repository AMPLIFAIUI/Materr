import { Capacitor, registerPlugin } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { LocalNotifications } from '@capacitor/local-notifications';

type GenericPermissionState = 'granted' | 'denied' | 'prompt';

type SMSPermission = { granted?: boolean; status?: GenericPermissionState };

type SMSPlugin = {
  checkPermission?: () => Promise<SMSPermission>;
  requestPermission?: () => Promise<SMSPermission>;
  send?: (options: { numbers: string[]; text: string }) => Promise<{ success?: boolean }>;
};

type ContactsPermissionResult = { contacts?: GenericPermissionState };

type ContactsPlugin = {
  checkPermissions?: () => Promise<ContactsPermissionResult>;
  requestPermissions?: () => Promise<ContactsPermissionResult>;
};

const SMS = registerPlugin<SMSPlugin>('SMS', {
  web: () => ({
    async checkPermission() {
      return { granted: false, status: 'denied' };
    },
    async requestPermission() {
      return { granted: false, status: 'denied' };
    },
    async send() {
      return { success: false };
    }
  })
});

const Contacts = registerPlugin<ContactsPlugin>('Contacts', {
  web: () => ({
    async checkPermissions() {
      return { contacts: 'denied' };
    },
    async requestPermissions() {
      return { contacts: 'denied' };
    }
  })
});

const OFFLINE_LOG_KEY = 'mate_emergency_action_log';

const hasWindowContext = typeof window !== 'undefined';
const hasNavigatorContext = typeof navigator !== 'undefined';

const getLocalStorage = (): Storage | null => {
  if (!hasWindowContext) {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const recordOfflineAction = (action: string, payload: Record<string, unknown>) => {
  const storage = getLocalStorage();
  if (!storage) {
    return;
  }

  try {
    const existing = JSON.parse(storage.getItem(OFFLINE_LOG_KEY) || '[]');
    existing.push({
      action,
      payload,
      timestamp: new Date().toISOString()
    });
    storage.setItem(OFFLINE_LOG_KEY, JSON.stringify(existing));
  } catch (error) {
    console.error('Failed to record emergency action log:', error);
  }
};

// Check if running on mobile device
export const isMobile = () => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

// Permission types for emergency features
export type PermissionType =
  | 'location'
  | 'sms'
  | 'phone'
  | 'contacts'
  | 'notifications';

export interface PermissionStatus {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
}

export interface EmergencyPermissions {
  location: PermissionStatus;
  sms: PermissionStatus;
  phone: PermissionStatus;
  contacts: PermissionStatus;
  notifications: PermissionStatus;
}

const toPermissionStatus = (state: GenericPermissionState | undefined, fallbackGranted = false): PermissionStatus => {
  if (!state) {
    return {
      granted: fallbackGranted,
      denied: !fallbackGranted,
      prompt: false
    };
  }

  return {
    granted: state === 'granted',
    denied: state === 'denied',
    prompt: state === 'prompt'
  };
};

/**
 * Request location permission for emergency alerts
 */
export const requestLocationPermission = async (): Promise<PermissionStatus> => {
  if (!isMobile()) {
    if (hasNavigatorContext && 'geolocation' in navigator) {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve({ granted: true, denied: false, prompt: false }),
          () => resolve({ granted: false, denied: true, prompt: false })
        );
      });
    }
    return { granted: false, denied: true, prompt: false };
  }

  try {
    const status = await Geolocation.checkPermissions();
    if (status.location === 'granted') {
      return toPermissionStatus('granted');
    }

    const requested = await Geolocation.requestPermissions();
    return toPermissionStatus(requested.location);
  } catch (error) {
    recordOfflineAction('location-permission-error', {
      error: error instanceof Error ? error.message : String(error)
    });
    return { granted: false, denied: true, prompt: false };
  }
};

/**
 * Get current location for emergency alerts
 */
export const getCurrentLocation = async (): Promise<{ lat: number; lng: number } | null> => {
  try {
    if (!isMobile()) {
      if (!hasNavigatorContext || !('geolocation' in navigator)) {
        return null;
      }
      return await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }),
          () => resolve(null)
        );
      });
    }

    const status = await requestLocationPermission();
    if (!status.granted) {
      return null;
    }

    const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };
  } catch (error) {
    recordOfflineAction('location-error', {
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
};

const ensureSMSPermission = async () => {
  if (!isMobile() || !Capacitor.isPluginAvailable('SMS')) {
    return false;
  }

  const permission = SMS.checkPermission ? await SMS.checkPermission() : { granted: true };
  if (permission?.granted) {
    return true;
  }

  const requested = SMS.requestPermission ? await SMS.requestPermission() : { granted: false };
  return !!requested?.granted;
};

/**
 * Request SMS permission for emergency messaging
 */
export const requestSMSPermission = async (): Promise<PermissionStatus> => {
  if (!isMobile()) {
    return { granted: false, denied: true, prompt: false };
  }

  try {
    const granted = await ensureSMSPermission();
    return {
      granted,
      denied: !granted,
      prompt: !granted
    };
  } catch (error) {
    recordOfflineAction('sms-permission-error', {
      error: error instanceof Error ? error.message : String(error)
    });
    return { granted: false, denied: true, prompt: false };
  }
};

const buildSMSBody = (
  message: string,
  location?: { lat: number; lng: number }
) => {
  if (!location) {
    return message;
  }
  const mapUrl = `https://maps.google.com/?q=${location.lat},${location.lng}`;
  return `${message}\n\nLocation: ${mapUrl}`;
};

/**
 * Send emergency SMS message
 */
export const sendEmergencySMS = async (
  phoneNumber: string,
  message: string,
  location?: { lat: number; lng: number }
): Promise<boolean> => {
  const smsBody = buildSMSBody(message, location);

  try {
    if (isMobile() && Capacitor.isPluginAvailable('SMS') && SMS.send) {
      const granted = await ensureSMSPermission();
      if (!granted) {
        recordOfflineAction('sms-permission-denied', { phoneNumber });
        return false;
      }

      const result = await SMS.send({ numbers: [phoneNumber], text: smsBody });
      const success = result?.success ?? true;
      if (!success) {
        recordOfflineAction('sms-send-failed', { phoneNumber });
      }
      return success;
    }

    if (Capacitor?.openURL) {
      await Capacitor.openURL(`sms:${phoneNumber}?body=${encodeURIComponent(smsBody)}`);
      return true;
    }
  } catch (error) {
    recordOfflineAction('sms-error', {
      phoneNumber,
      error: error instanceof Error ? error.message : String(error)
    });
  }

  recordOfflineAction('sms-offline-queued', { phoneNumber, message: smsBody });
  return false;
};

/**
 * Request phone permission for emergency calls
 */
export const requestPhonePermission = async (): Promise<PermissionStatus> => {
  if (!isMobile()) {
    return { granted: false, denied: true, prompt: false };
  }

  return { granted: true, denied: false, prompt: false };
};

/**
 * Make emergency phone call
 */
export const makeEmergencyCall = async (phoneNumber: string): Promise<boolean> => {
  try {
    if (Capacitor?.openURL) {
      await Capacitor.openURL(`tel:${phoneNumber}`);
      return true;
    }
  } catch (error) {
    recordOfflineAction('phone-call-error', {
      phoneNumber,
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }

  recordOfflineAction('phone-call-offline', { phoneNumber });
  return false;
};

/**
 * Request contacts permission
 */
export const requestContactsPermission = async (): Promise<PermissionStatus> => {
  if (!isMobile() || !Capacitor.isPluginAvailable('Contacts')) {
    return { granted: false, denied: true, prompt: false };
  }

  try {
    const status = Contacts.checkPermissions ? await Contacts.checkPermissions() : { contacts: 'denied' };
    if (status?.contacts === 'granted') {
      return toPermissionStatus('granted');
    }

    const requested = Contacts.requestPermissions ? await Contacts.requestPermissions() : { contacts: 'denied' };
    return toPermissionStatus(requested?.contacts, false);
  } catch (error) {
    recordOfflineAction('contacts-permission-error', {
      error: error instanceof Error ? error.message : String(error)
    });
    return { granted: false, denied: true, prompt: false };
  }
};

/**
 * Request notification permission
 */
export const requestNotificationPermission = async (): Promise<PermissionStatus> => {
  try {
    if (!isMobile()) {
      if (hasWindowContext && 'Notification' in window) {
        const permission = await Notification.requestPermission();
        return toPermissionStatus(permission as GenericPermissionState, permission === 'granted');
      }
      return { granted: false, denied: true, prompt: false };
    }

    const status = await LocalNotifications.checkPermissions();
    if (status.display === 'granted') {
      return toPermissionStatus('granted');
    }

    const requested = await LocalNotifications.requestPermissions();
    return toPermissionStatus(requested.display);
  } catch (error) {
    recordOfflineAction('notification-permission-error', {
      error: error instanceof Error ? error.message : String(error)
    });
    return { granted: false, denied: true, prompt: false };
  }
};

/**
 * Show emergency notification
 */
export const showEmergencyNotification = async (
  title: string,
  body: string
): Promise<boolean> => {
  try {
    if (!isMobile()) {
      if (hasWindowContext && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/MATE/Mate192x192.png' });
        return true;
      }
      recordOfflineAction('notification-web-blocked', { title, body });
      return false;
    }

    const permission = await requestNotificationPermission();
    if (!permission.granted) {
      return false;
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          id: Date.now(),
          title,
          body,
          schedule: { at: new Date() },
          smallIcon: 'ic_stat_icon_config_sample',
          sound: undefined
        }
      ]
    });
    return true;
  } catch (error) {
    recordOfflineAction('notification-error', {
      title,
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
};

/**
 * Check all emergency permissions status
 */
export const checkAllPermissions = async (): Promise<EmergencyPermissions> => {
  const location = await requestLocationPermission();
  const sms = await requestSMSPermission();
  const phone = await requestPhonePermission();
  const contacts = await requestContactsPermission();
  const notifications = await requestNotificationPermission();

  return {
    location,
    sms,
    phone,
    contacts,
    notifications
  };
};

/**
 * Request all critical emergency permissions
 */
export const requestEmergencyPermissions = async (): Promise<EmergencyPermissions> => {
  const permissions = await checkAllPermissions();
  recordOfflineAction('permissions-evaluated', permissions as unknown as Record<string, unknown>);
  return permissions;
};
