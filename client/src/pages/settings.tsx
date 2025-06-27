import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/theme-context";
import { useToast } from "@/hooks/use-toast";
import { Shield, ArrowLeft, Users, ChevronRight } from "lucide-react";
import { ProfileIconWithName } from "@/components/ProfileIconWithName";
import { useLocation } from "wouter";
import type { EmergencyContact } from "@/lib/crisisDetection";

const REGIONS = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];
const PRIVATE_MODE_KEY = "matePrivateMode";
const PRIVATE_MODE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export function RegionSettings({ value, onChange }: { value: string; onChange: (region: string) => void }) {
  return (
    <div className="space-y-2">
      <label className="block font-medium mb-1">Your Region</label>
      <div className="flex flex-wrap gap-2">
        {REGIONS.map((region) => (
          <Button
            key={region}
            variant={value === region ? "default" : "outline"}
            onClick={() => onChange(region)}
            className="text-xs px-3 py-1"
          >
            {region}
          </Button>
        ))}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [region, setRegion] = useState(() => localStorage.getItem("userRegion") || "NSW");
  const [privateMode, setPrivateMode] = useState(false);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const { setTheme } = useTheme();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Handle back navigation
  const handleBack = () => {
    // Try to go back in browser history
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Fallback to home if no history
      setLocation("/");
    }
  };

  // Check private mode on mount
  useEffect(() => {
    const data = localStorage.getItem(PRIVATE_MODE_KEY);
    if (data) {
      const { activatedAt } = JSON.parse(data);
      if (Date.now() - activatedAt < PRIVATE_MODE_DURATION) {
        setPrivateMode(true);
        // Keep theme dark regardless of private mode
        setTheme("dark");
      } else {
        localStorage.removeItem(PRIVATE_MODE_KEY);
        setPrivateMode(false);
      }
    }
    
    // Always set theme to dark (permanent dark mode)
    setTheme("dark");
    
    // Load emergency contacts
    loadEmergencyContacts();
  }, [setTheme]);

  const loadEmergencyContacts = () => {
    const stored = localStorage.getItem('emergencyContacts_1'); // Default user ID
    if (stored) {
      setEmergencyContacts(JSON.parse(stored));
    }
  };

  // Auto-expire private mode after 24h
  useEffect(() => {
    if (privateMode) {
      const timeout = setTimeout(() => {
        setPrivateMode(false);
        localStorage.removeItem(PRIVATE_MODE_KEY);
        // Keep theme dark even when private mode expires
        setTheme("dark");
      }, PRIVATE_MODE_DURATION);
      return () => clearTimeout(timeout);
    }
  }, [privateMode, setTheme]);

  const handleRegionChange = (newRegion: string) => {
    setRegion(newRegion);
    localStorage.setItem("userRegion", newRegion);
  };

  const handlePrivateModeToggle = () => {
    if (!privateMode) {
      setPrivateMode(true);
      setTheme("dark");
      localStorage.setItem(PRIVATE_MODE_KEY, JSON.stringify({ activatedAt: Date.now() }));
      toast({
        title: "Private Mode Activated",
        description: "You are now in private mode for 24 hours. Chats and data will be hidden."
      });
    } else {
      setPrivateMode(false);
      // Keep dark theme even when private mode is disabled
      setTheme("dark");
      localStorage.removeItem(PRIVATE_MODE_KEY);
      toast({
        title: "Private Mode Deactivated",
        description: "You have exited private mode."
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 transition-colors">
      <div className="max-w-md mx-auto bg-gray-900 dark:bg-gray-800 shadow-xl min-h-screen relative p-6">
        {/* Back Button */}
        <div className="flex items-center mb-4 gap-2 justify-between">
          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Back"
              onClick={() => window.history.length > 1 ? window.history.back() : setLocation('/')}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold">Settings</h1>
          </div>
          <ProfileIconWithName onClick={() => setLocation('/profile')} />
        </div>
        {/* Themed dropdown for region selection */}
        <div className="mb-8">
          <label className="block font-medium mb-1 text-white">Your Region</label>
          <div className="relative">
            <select
              value={region}
              onChange={e => handleRegionChange(e.target.value)}
              className="w-full rounded-lg border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-gray-800 text-blue-900 dark:text-blue-200 py-2 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all appearance-none"
            >
              {REGIONS.map(regionOption => (
                <option key={regionOption} value={regionOption}>{regionOption}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <svg className="w-5 h-5 text-blue-400 dark:text-blue-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </span>
          </div>
        </div>
        {/* Private mode toggle has been moved to chat interface */}
        <div className="mt-8">
          <Button
            onClick={() => setLocation("/emergency-contacts")}
            className="w-full justify-between p-4 h-auto bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors rounded-xl"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-blue-500 dark:text-blue-300" />
              <div className="text-left">
                <h2 className="font-semibold text-blue-900 dark:text-blue-200">Emergency Contacts</h2>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  {emergencyContacts.length === 0 ? (
                    "No contacts configured"
                  ) : (
                    <div className="space-y-1">
                      <p>{emergencyContacts.length}/10 contacts configured</p>
                      {emergencyContacts.find(c => c.isPrimary) && (
                        <p className="text-xs">
                          Primary: {emergencyContacts.find(c => c.isPrimary)?.name}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-blue-400 dark:text-blue-300" />
          </Button>
          {emergencyContacts.length > 0 && (
            <div className="mt-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                <i className="fas fa-check-circle"></i>
                Crisis detection enabled with {emergencyContacts.length} contact{emergencyContacts.length !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>
        <div className="mt-8">
          <Button
            onClick={() => setLocation("/reminders")}
            className="w-full justify-between p-4 h-auto bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors rounded-xl"
          >
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-blue-500 dark:text-blue-300">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-left">
                <h2 className="font-semibold text-blue-900 dark:text-blue-200">Reminders</h2>
                <p className="text-sm text-blue-700 dark:text-blue-300">Set up self-care reminders and check-ins</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-blue-400 dark:text-blue-300" />
          </Button>
        </div>
      </div>
    </div>
  );
}
