import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/theme-context";
import { useToast } from "@/hooks/use-toast";
import { Shield, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

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
        setTheme("dark");
      } else {
        localStorage.removeItem(PRIVATE_MODE_KEY);
        setPrivateMode(false);
      }
    }
  }, [setTheme]);

  // Auto-expire private mode after 24h
  useEffect(() => {
    if (privateMode) {
      const timeout = setTimeout(() => {
        setPrivateMode(false);
        localStorage.removeItem(PRIVATE_MODE_KEY);
        setTheme("light");
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
      setTheme("light");
      localStorage.removeItem(PRIVATE_MODE_KEY);
      toast({
        title: "Private Mode Deactivated",
        description: "You have exited private mode."
      });
    }
  };

  return (
    <div className={`min-h-screen ${privateMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors`}>
      <div className={`max-w-md mx-auto ${privateMode ? 'bg-gray-900' : 'bg-white'} dark:bg-gray-800 shadow-xl min-h-screen relative p-6`}>        <div className="flex items-center mb-4 gap-2">
          <button
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Back"
            onClick={handleBack}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            Settings
            {privateMode && <Shield className="text-pink-500" />}
          </h1>
        </div>
        <RegionSettings value={region} onChange={handleRegionChange} />
        <div className="mt-8">
          <label className="block font-medium mb-1 flex items-center gap-2">            <button
              onClick={handlePrivateModeToggle}
              className={`rounded-full p-2 border ${privateMode ? 'bg-gray-800 border-pink-500' : 'bg-gray-200 border-gray-400'} transition-colors`}
              title="Toggle Private Mode"
            >
              <i className={`fas fa-user-secret text-lg ${privateMode ? 'text-pink-500' : 'text-gray-500'}`}></i>
            </button>
            Private Mode
            {privateMode && <span className="ml-2 text-xs text-pink-500">Active (expires in 24h)</span>}
          </label>
        </div>
        <div className="mt-8">
          <h2 className="font-semibold mb-2">Emergency Contacts <span className="text-xs text-gray-400">(coming soon)</span></h2>
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-gray-500 dark:text-gray-300">Add trusted contacts for emergencies.</div>
        </div>
        <div className="mt-8">
          <h2 className="font-semibold mb-2">Reminders <span className="text-xs text-gray-400">(coming soon)</span></h2>
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-gray-500 dark:text-gray-300">Set up reminders for check-ins and self-care.</div>
        </div>
      </div>
    </div>
  );
}
