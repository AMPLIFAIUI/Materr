import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, MapPin, MessageSquare, Phone, Bell, AlertTriangle } from 'lucide-react';
import { 
  requestEmergencyPermissions, 
  type EmergencyPermissions,
  isMobile 
} from '@/lib/emergencyPermissions';

export default function EmergencyPermissionsStatus() {
  const [permissions, setPermissions] = useState<EmergencyPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadPermissionStatus();
  }, []);

  const loadPermissionStatus = () => {
    const stored = localStorage.getItem('emergencyPermissions');
    if (stored) {
      setPermissions(JSON.parse(stored));
    }
  };

  const requestPermissions = async () => {
    setIsLoading(true);
    try {
      const newPermissions = await requestEmergencyPermissions();
      setPermissions(newPermissions);
      localStorage.setItem('emergencyPermissions', JSON.stringify(newPermissions));
    } catch (error) {
      console.error('Error requesting permissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPermissionIcon = (type: string, granted: boolean) => {
    const IconComponent = {
      location: MapPin,
      sms: MessageSquare,
      phone: Phone,
      notifications: Bell,
      contacts: Shield
    }[type] || Shield;

    return (
      <IconComponent 
        className={`w-5 h-5 ${granted ? 'text-green-500' : 'text-red-500'}`} 
      />
    );
  };

  const getPermissionStatus = (status: any) => {
    if (status.granted) return 'Granted';
    if (status.denied) return 'Denied';
    if (status.prompt) return 'Not Asked';
    return 'Unknown';
  };

  const getPermissionDescription = (type: string) => {
    const descriptions = {
      location: 'Required to send your location in emergency alerts',
      sms: 'Required to send SMS messages to emergency contacts',
      phone: 'Required to make emergency phone calls',
      notifications: 'Required to show crisis alert notifications',
      contacts: 'Optional - to import contacts from your device'
    };
    return descriptions[type] || '';
  };

  const allCriticalGranted = permissions && 
    permissions.location.granted && 
    permissions.sms.granted && 
    permissions.phone.granted && 
    permissions.notifications.granted;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Shield className={`w-5 h-5 ${allCriticalGranted ? 'text-green-500' : 'text-yellow-500'}`} />
          Emergency Permissions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {!permissions && (
          <div className="text-center py-4">
            <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-yellow-500" />
            <p className="text-gray-300 mb-4">
              Emergency permissions not initialized
            </p>
            <Button onClick={requestPermissions} disabled={isLoading}>
              {isLoading ? 'Checking...' : 'Check Permissions'}
            </Button>
          </div>
        )}

        {permissions && (
          <>
            <div className="grid gap-3">
              {Object.entries(permissions).map(([type, status]) => (
                <div key={type} className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/50">
                  {getPermissionIcon(type, status.granted)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-white capitalize">{type}</h4>
                      <span 
                        className={`text-xs px-2 py-1 rounded ${
                          status.granted 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {getPermissionStatus(status)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {getPermissionDescription(type)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {!allCriticalGranted && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <span className="text-yellow-400 font-medium">Action Required</span>
                </div>
                <p className="text-sm text-gray-300 mb-3">
                  Some critical permissions are missing. This may prevent emergency alerts from working properly.
                </p>
                <Button 
                  onClick={requestPermissions} 
                  disabled={isLoading}
                  size="sm"
                  variant="outline"
                  className="border-yellow-500 text-yellow-500"
                >
                  {isLoading ? 'Requesting...' : 'Request Permissions'}
                </Button>
              </div>
            )}

            {allCriticalGranted && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span className="text-green-400 font-medium">Ready for Emergencies</span>
                </div>
                <p className="text-sm text-gray-300 mt-1">
                  All critical permissions are granted. Crisis detection and emergency response are fully functional.
                </p>
              </div>
            )}

            {!isMobile() && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <i className="fas fa-info-circle text-blue-400"></i>
                  <span className="text-blue-400 font-medium">Web Version</span>
                </div>
                <p className="text-sm text-gray-300">
                  You're using the web version. Some features like SMS and phone calls will open external apps. Install the mobile app for full emergency response capabilities.
                </p>
              </div>
            )}

          </>
        )}

      </CardContent>
    </Card>
  );
}
