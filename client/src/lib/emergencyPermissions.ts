import { CapacitorConfig } from '@capacitor/cli';

// Check if running on mobile device
export const isMobile = () => {
  return (window as any).Capacitor?.isNativePlatform() || false;
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

/**
 * Request location permission for emergency alerts
 */
export const requestLocationPermission = async (): Promise<PermissionStatus> => {
  if (!isMobile()) {
    // Web fallback - use navigator.geolocation
    if ('geolocation' in navigator) {
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
    // Try to use Capacitor Geolocation plugin
    const { Geolocation } = await import('@capacitor/geolocation').catch(() => ({ Geolocation: null }));
    if (!Geolocation) {
      // Plugin not available
      return { granted: false, denied: true, prompt: false };
    }
    
    const permission = await Geolocation.requestPermissions();
    
    return {
      granted: permission.location === 'granted',
      denied: permission.location === 'denied',
      prompt: permission.location === 'prompt'
    };
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return { granted: false, denied: true, prompt: false };
  }
};

/**
 * Get current location for emergency alerts
 */
export const getCurrentLocation = async (): Promise<{lat: number, lng: number} | null> => {
  try {
    if (!isMobile()) {
      // Web fallback
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }),
          () => resolve(null)
        );
      });
    }

    // Mobile - use Capacitor
    const { Geolocation } = await import('@capacitor/geolocation').catch(() => ({ Geolocation: null }));
    if (!Geolocation) {
      return null;
    }
    
    const position = await Geolocation.getCurrentPosition();
    
    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
};

/**
 * Request SMS permission for emergency messaging
 */
export const requestSMSPermission = async (): Promise<PermissionStatus> => {
  if (!isMobile()) {
    // Web - can use SMS URL scheme, return as granted
    return { granted: true, denied: false, prompt: false };
  }

  // Mobile - SMS permissions are handled by the system when sending
  // We'll assume available (actual permission check happens when sending)
  return { granted: true, denied: false, prompt: false };
};

/**
 * Send emergency SMS message
 */
export const sendEmergencySMS = async (
  phoneNumber: string, 
  message: string, 
  location?: {lat: number, lng: number}
): Promise<boolean> => {
  if (!isMobile()) {
    // Web fallback - open SMS app
    const smsBody = location 
      ? `${message}\n\nLocation: https://maps.google.com/?q=${location.lat},${location.lng}`
      : message;
    
    const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(smsBody)}`;
    window.open(smsUrl, '_blank');
    return true;
  }

  try {
    // Placeholder for SMS functionality
    // In production, this would use a proper SMS service
    console.log(`SMS to ${phoneNumber}: ${message}`);
    
    // For now, fallback to opening SMS app
    const smsBody = location 
      ? `${message}\n\nLocation: https://maps.google.com/?q=${location.lat},${location.lng}`
      : message;
    
    const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(smsBody)}`;
    window.open(smsUrl, '_blank');
    return true;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
};

/**
 * Request phone permission for emergency calls
 */
export const requestPhonePermission = async (): Promise<PermissionStatus> => {
  if (!isMobile()) {
    return { granted: true, denied: false, prompt: false }; // Web can use tel: links
  }

  // Phone permissions are typically granted by default
  return { granted: true, denied: false, prompt: false };
};

/**
 * Make emergency phone call
 */
export const makeEmergencyCall = async (phoneNumber: string): Promise<boolean> => {
  try {
    const telUrl = `tel:${phoneNumber}`;
    
    if (isMobile()) {
      // Placeholder for Capacitor App plugin
      // In production, this would use proper Capacitor navigation
      window.open(telUrl, '_blank');
    } else {
      // Web - open tel link
      window.open(telUrl, '_blank');
    }
    
    return true;
  } catch (error) {
    console.error('Error making phone call:', error);
    return false;
  }
};

/**
 * Request contacts permission
 */
export const requestContactsPermission = async (): Promise<PermissionStatus> => {
  if (!isMobile()) {
    return { granted: false, denied: true, prompt: false };
  }

  try {
    // This would require a contacts plugin like @capacitor-community/contacts
    // For now, we'll return false since we're not implementing contact import
    return { granted: false, denied: true, prompt: false };
  } catch (error) {
    return { granted: false, denied: true, prompt: false };
  }
};

/**
 * Request notification permission
 */
export const requestNotificationPermission = async (): Promise<PermissionStatus> => {
  try {
    if (!isMobile()) {
      // Web notifications
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        return {
          granted: permission === 'granted',
          denied: permission === 'denied',
          prompt: permission === 'default'
        };
      }
      return { granted: false, denied: true, prompt: false };
    }

    // Mobile notifications - placeholder
    // In production, this would use proper Capacitor Local Notifications
    console.log('Mobile notification permission - placeholder implementation');
    return { granted: true, denied: false, prompt: false };
  } catch (error) {
    console.error('Error requesting notification permission:', error);
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
      // Web notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/MATE/Mate192x192.png' });
        return true;
      }
      return false;
    }

    // Mobile notification - placeholder
    // In production, this would use proper Capacitor Local Notifications
    console.log(`Mobile notification: ${title} - ${body}`);
    
    // Fallback - try web notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/MATE/Mate192x192.png' });
      return true;
    }
    return true; // Assume success for placeholder
  } catch (error) {
    console.error('Error showing notification:', error);
    return false;
  }
};

/**
 * Check all emergency permissions status
 */
export const checkAllPermissions = async (): Promise<EmergencyPermissions> => {
  const [location, sms, phone, contacts, notifications] = await Promise.all([
    requestLocationPermission(),
    requestSMSPermission(),
    requestPhonePermission(),
    requestContactsPermission(),
    requestNotificationPermission()
  ]);

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
  console.log('Requesting emergency permissions...');
  
  const permissions = await checkAllPermissions();
  
  // Log permission status
  console.log('Emergency permissions status:', permissions);
  
  return permissions;
};
