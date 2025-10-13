import {
  getCurrentLocation,
  sendEmergencySMS,
  makeEmergencyCall,
  showEmergencyNotification,
  requestEmergencyPermissions
} from './emergencyPermissions';
import { decryptData } from './secureStorage';

export interface EmergencyContact {
  id: number;
  name: string;
  phone: string;
  relationship: 'family' | 'friend' | 'professional' | 'other';
  isPrimary: boolean;
  verified: boolean;
}

export interface CrisisAlert {
  id: string;
  userId: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  triggerMessage: string;
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  contactsNotified: string[];
  responseReceived: boolean;
  escalated: boolean;
}

// Crisis keywords and patterns
const CRISIS_KEYWORDS = {
  suicide: [
    "kill myself", "end it all", "not worth living", "want to die",
    "suicide", "suicidal", "end my life", "take my own life",
    "better off dead", "can't go on", "no point living",
    "planning to die", "have a plan", "suicide plan"
  ],
  selfHarm: [
    "hurt myself", "cut myself", "cutting", "self harm",
    "burn myself", "overdose", "pills", "self injury",
    "hurting myself", "harm myself", "cut my wrists"
  ],
  immediateRisk: [
    "right now", "tonight", "today", "this moment",
    "about to", "going to do it", "ready to",
    "can't wait", "now or never", "final decision"
  ],
  abuse: [
    "hitting me", "abusing me", "threatens me", "hurts me",
    "won't let me leave", "controls everything", "scared to go home",
    "violence", "domestic violence", "abusive relationship"
  ],
  hopelessness: [
    "no hope", "hopeless", "nothing matters", "no future",
    "pointless", "why bother", "give up", "no way out",
    "trapped", "can't escape", "no one cares"
  ]
};

export class CrisisDetectionService {
  
  static assessRiskLevel(message: string): "low" | "medium" | "high" | "critical" {
    const lowerMessage = message.toLowerCase();
    let riskScore = 0;
    
    // Check for different types of crisis indicators
    const suicideMatches = CRISIS_KEYWORDS.suicide.filter(keyword => 
      lowerMessage.includes(keyword)).length;
    const selfHarmMatches = CRISIS_KEYWORDS.selfHarm.filter(keyword => 
      lowerMessage.includes(keyword)).length;
    const immediateMatches = CRISIS_KEYWORDS.immediateRisk.filter(keyword => 
      lowerMessage.includes(keyword)).length;
    const abuseMatches = CRISIS_KEYWORDS.abuse.filter(keyword => 
      lowerMessage.includes(keyword)).length;
    const hopelessnessMatches = CRISIS_KEYWORDS.hopelessness.filter(keyword => 
      lowerMessage.includes(keyword)).length;
    
    // Scoring algorithm
    riskScore += suicideMatches * 4;
    riskScore += selfHarmMatches * 3;
    riskScore += immediateMatches * 5;
    riskScore += abuseMatches * 3;
    riskScore += hopelessnessMatches * 2;
    
    // Multiple categories increase risk
    const categoriesHit = [
      suicideMatches > 0,
      selfHarmMatches > 0,
      immediateMatches > 0,
      abuseMatches > 0,
      hopelessnessMatches > 0
    ].filter(Boolean).length;
    
    if (categoriesHit >= 2) riskScore += 3;
    
    // Determine risk level
    if (riskScore >= 8 || (suicideMatches > 0 && immediateMatches > 0)) {
      return "critical";
    } else if (riskScore >= 5 || suicideMatches > 0) {
      return "high";
    } else if (riskScore >= 3 || selfHarmMatches > 0) {
      return "medium";
    } else {
      return "low";
    }
  }
  
  static async triggerEmergencyResponse(
    riskLevel: "high" | "critical",
    message: string,
    userId: number
  ): Promise<CrisisAlert> {

    // Get user's emergency contacts
    const emergencyContacts = await this.getEmergencyContacts(userId);
    if (emergencyContacts.length === 0) {
      console.warn('No emergency contacts configured for crisis response.');
    }
    
    // Get user's location if permission granted
    const location = await this.getCurrentLocation();
    
    // Create crisis alert
    const alert: CrisisAlert = {
      id: Date.now().toString(),
      userId,
      riskLevel,
      triggerMessage: message,
      timestamp: new Date(),
      location,
      contactsNotified: [],
      responseReceived: false,
      escalated: false
    };
    
    // Send immediate crisis resources to user
    this.showCrisisResources(riskLevel);
    
    // Notify emergency contacts
    if (riskLevel === "critical") {
      await this.notifyAllContacts(emergencyContacts, alert);
    } else if (riskLevel === "high") {
      await this.notifyPrimaryContacts(emergencyContacts, alert);
    }
    
    // Start escalation timer
    this.startEscalationTimer(alert);
    
    // Log the alert
    this.logCrisisAlert(alert);
    
    return alert;
  }
  
  private static async getEmergencyContacts(userId: number): Promise<EmergencyContact[]> {
    const stored = localStorage.getItem(`emergencyContacts_${userId}`);
    if (!stored) {
      return [];
    }

    try {
      const decrypted = await decryptData(stored);
      if (!decrypted) {
        return [];
      }
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Failed to decrypt emergency contacts:', error);
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }
  }
  
  private static async getCurrentLocation(): Promise<{latitude: number, longitude: number, address?: string} | undefined> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(undefined);
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          
          // Attempt to get readable address
          try {
            const address = await this.reverseGeocode(location.latitude, location.longitude);
            resolve({ ...location, address });
          } catch {
            resolve(location);
          }
        },
        () => resolve(undefined),
        { timeout: 5000 }
      );
    });
  }
  
  private static async reverseGeocode(lat: number, lng: number): Promise<string> {
    // Simple reverse geocoding - in production, use proper service
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
  
  private static showCrisisResources(riskLevel: "high" | "critical"): void {
    // Show immediate crisis resources in the UI
    const resources = {
      critical: {
        title: "IMMEDIATE CRISIS SUPPORT",
        message: "If you're in immediate danger, please call emergency services.",
        contacts: [
          { name: "Emergency Services", number: "000" },
          { name: "Lifeline", number: "13 11 14" },
          { name: "Crisis Text Line", number: "Text HOME to 741741" }
        ]
      },
      high: {
        title: "Crisis Support Available",
        message: "We're concerned about you. Please reach out for support.",
        contacts: [
          { name: "Lifeline", number: "13 11 14" },
          { name: "Beyond Blue", number: "1300 22 4636" },
          { name: "Mental Health Crisis Line", number: "1800 011 511" }
        ]
      }
    };
    
    // This would trigger a modal/overlay in the UI
    this.displayCrisisModal(resources[riskLevel]);
  }
  
  private static displayCrisisModal(resources: any): void {
    // Trigger UI modal - implementation depends on UI framework
    const event = new CustomEvent('showCrisisModal', { detail: resources });
    window.dispatchEvent(event);
  }
  
  private static async notifyAllContacts(contacts: EmergencyContact[], alert: CrisisAlert): Promise<void> {
    for (const contact of contacts) {
      await this.sendEmergencyMessage(contact, alert);
    }
  }
  
  private static async notifyPrimaryContacts(contacts: EmergencyContact[], alert: CrisisAlert): Promise<void> {
    const primaryContacts = contacts.filter(c => c.isPrimary).slice(0, 2);
    for (const contact of primaryContacts) {
      await this.sendEmergencyMessage(contact, alert);
    }
  }
  
  private static async sendEmergencyMessage(contact: EmergencyContact, alert: CrisisAlert): Promise<void> {
    try {
      // Use the new emergency alert system
      await this.sendEmergencyAlert(contact, alert);
      alert.contactsNotified.push(contact.id.toString());
    } catch (error) {
      console.error(`Failed to notify ${contact.name}:`, error);
    }
  }
  
  private static buildEmergencyMessage(contact: EmergencyContact, alert: CrisisAlert): string {
    let message = `URGENT: Mental health crisis alert for your contact. They may need immediate support. `;
    
    if (alert.location) {
      message += `Last known location: ${alert.location.address || `${alert.location.latitude}, ${alert.location.longitude}`}. `;
    }
    
    message += `Please reach out to them immediately. If you cannot reach them, consider contacting emergency services (000) or Lifeline (13 11 14).`;
    
    return message;
  }
  
  private static async sendEmergencyAlert(contact: EmergencyContact, alert: CrisisAlert): Promise<void> {
    try {
      // Get current location for emergency message
      const location = await getCurrentLocation();
      if (location) {
        alert.location = {
          latitude: location.lat,
          longitude: location.lng,
          address: `${location.lat}, ${location.lng}`
        };
      }

      // Build emergency message
      const message = this.buildEmergencyMessage(contact, alert);
      
      // Send SMS with location
      const smsSent = await sendEmergencySMS(contact.phone, message, location);
      
      if (smsSent) {
        console.log(`Emergency SMS sent to ${contact.name} (${contact.phone})`);
        
        // Show notification to user
        await showEmergencyNotification(
          'Emergency Contact Notified',
          `${contact.name} has been alerted about your safety`
        );
      } else {
        // Fallback - try to open phone dialer
        console.log('SMS failed, attempting to open phone dialer');
        await makeEmergencyCall(contact.phone);
      }
      
    } catch (error) {
      console.error(`Failed to send emergency alert to ${contact.name}:`, error);
      
      // Final fallback - try phone call
      try {
        await makeEmergencyCall(contact.phone);
      } catch (callError) {
        console.error('Phone call fallback also failed:', callError);
      }
    }
  }
  
  private static startEscalationTimer(alert: CrisisAlert): void {
    // Set timer for escalation if no response
    const escalationTime = alert.riskLevel === "critical" ? 15 * 60 * 1000 : 30 * 60 * 1000; // 15 or 30 minutes
    
    setTimeout(() => {
      if (!alert.responseReceived) {
        this.escalateToAuthorities(alert);
      }
    }, escalationTime);
  }
  
  private static escalateToAuthorities(alert: CrisisAlert): void {
    alert.escalated = true;
    
    // In production, this would:
    // 1. Contact local emergency services
    // 2. Provide user information and last known location
    // 3. Follow local protocols for mental health emergencies
    
    console.log("ESCALATING TO AUTHORITIES", alert);
    
    // Log escalation
    this.logCrisisEscalation(alert);
  }
  
  private static logCrisisAlert(alert: CrisisAlert): void {
    const existingAlerts = JSON.parse(localStorage.getItem('crisisAlerts') || '[]');
    existingAlerts.push(alert);
    localStorage.setItem('crisisAlerts', JSON.stringify(existingAlerts));
  }
  
  private static logCrisisEscalation(alert: CrisisAlert): void {
    const existingEscalations = JSON.parse(localStorage.getItem('crisisEscalations') || '[]');
    existingEscalations.push({
      alertId: alert.id,
      escalatedAt: new Date(),
      reason: 'No response from emergency contacts'
    });
    localStorage.setItem('crisisEscalations', JSON.stringify(existingEscalations));
  }
  
  static markResponseReceived(alertId: string): void {
    const alerts = JSON.parse(localStorage.getItem('crisisAlerts') || '[]');
    const alert = alerts.find((a: CrisisAlert) => a.id === alertId);
    if (alert) {
      alert.responseReceived = true;
      localStorage.setItem('crisisAlerts', JSON.stringify(alerts));
    }
  }

  /**
   * Initialize emergency permissions for crisis response
   */
  static async initializeEmergencyPermissions(): Promise<void> {
    try {
      console.log('Initializing emergency permissions...');
      
      // Request all critical permissions
      const permissions = await requestEmergencyPermissions();
      
      // Store permission status
      localStorage.setItem('emergencyPermissions', JSON.stringify(permissions));
      
      // Warn user about denied permissions
      const deniedPermissions = [];
      if (!permissions.location.granted) deniedPermissions.push('Location');
      if (!permissions.sms.granted) deniedPermissions.push('SMS');
      if (!permissions.notifications.granted) deniedPermissions.push('Notifications');
      
      if (deniedPermissions.length > 0) {
        console.warn('Some emergency permissions were denied:', deniedPermissions);
        
        // Show warning notification
        if (permissions.notifications.granted) {
          await showEmergencyNotification(
            'Emergency Permissions Required',
            `Please enable ${deniedPermissions.join(', ')} permissions for full crisis response capability`
          );
        }
      } else {
        console.log('All emergency permissions granted');
      }
      
    } catch (error) {
      console.error('Error initializing emergency permissions:', error);
    }
  }

  /**
   * Check if emergency permissions are available
   */
  static getEmergencyPermissionsStatus(): any {
    const stored = localStorage.getItem('emergencyPermissions');
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  }
}

// Export for use in chat system
