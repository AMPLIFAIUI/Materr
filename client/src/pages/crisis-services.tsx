import { useCrisisServices } from "@/hooks/use-crisis-services";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronDown, MapPin } from "lucide-react";
import { useLocation } from "wouter";

export default function CrisisServicesPage() {
  const [region, setRegion] = useState<string>("NSW");
  const { services, loading } = useCrisisServices(region);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();
  const regions = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];
  const [geoStatus, setGeoStatus] = useState<string>("");
  const [postcode, setPostcode] = useState("");

  // Try to auto-detect region using geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      setGeoStatus("Detecting your location...");
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          // Use a simple offline-friendly region guess based on lat/lon bounding boxes
          const { latitude, longitude } = pos.coords;
          let detectedRegion = "NSW";
          if (longitude > 138 && longitude < 154 && latitude < -10 && latitude > -44) {
            // Rough bounding boxes for Australian states
            if (latitude < -37) detectedRegion = "TAS";
            else if (longitude > 150 && latitude > -35) detectedRegion = "QLD";
            else if (longitude < 142) detectedRegion = "SA";
            else if (longitude > 144 && longitude < 150 && latitude > -39 && latitude < -33) detectedRegion = "VIC";
            else if (longitude > 115 && longitude < 130) detectedRegion = "WA";
            else if (longitude > 130 && longitude < 138) detectedRegion = "NT";
            else if (longitude > 149 && longitude < 151 && latitude > -36 && latitude < -34) detectedRegion = "ACT";
            else detectedRegion = "NSW";
          }
          setRegion(detectedRegion);
          setGeoStatus(`Detected region: ${detectedRegion}`);
        } catch {
          setGeoStatus("");
        }
      }, () => setGeoStatus(""), { timeout: 5000 });
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-start relative">
      {/* Animated background */}
      <div className="modern-bg-blobs"></div>
      
      <div className="max-w-md w-full mx-auto glass-card min-h-screen relative flex flex-col z-10">
        <header className="bg-gradient-to-r from-blue-500/80 to-purple-500/80 dark:from-gray-800 dark:to-gray-900 text-white p-4 pt-safe shadow-lg sticky top-0 z-10 rounded-b-3xl glass-card">
          <div className="flex items-center justify-between min-h-[64px]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.history.length > 1 ? window.history.back() : setLocation('/')}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-semibold">Crisis Services</h1>
            </div>
          </div>
          
          {/* Themed dropdown for region selection, with geolocation status */}
          <div className="mt-4 relative" ref={dropdownRef}>
            <label className="block text-sm text-blue-100 mb-1 flex items-center gap-2">
              <MapPin className="w-4 h-4 inline-block text-blue-200" />
              {geoStatus ? geoStatus : "Select your region"}
            </label>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center justify-between glass-card px-4 py-3 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Select region"
            >
              <span className="font-medium">{region}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'transform rotate-180' : ''}`} />
            </button>
            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 glass-card rounded-xl border border-white/20 shadow-xl z-20 overflow-hidden max-h-60 overflow-y-auto">
                {regions.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setRegion(r);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 transition-colors hover:bg-white/10 ${region === r ? 'bg-white/20 font-medium' : ''}`}
                    title={`Select ${r} region`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>
        <div className="p-6 flex-1">
          {/* Postcode input for local services */}
          <div className="mb-4">
            <label htmlFor="postcode" className="block text-blue-100 mb-1">Enter your postcode or town (optional for local help):</label>
            <input
              id="postcode"
              type="text"
              value={postcode}
              onChange={e => setPostcode(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-white/20 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 2000 or Sydney"
              maxLength={10}
            />
          </div>
          {/* Top 3 local services if postcode/town entered */}
          {postcode && services.length > 0 && (
            <div className="space-y-4 mb-8">
              <h3 className="text-blue-200 text-sm font-semibold mb-2">Top Local Crisis Services</h3>
              {services.filter(s =>
                s.name.toLowerCase().includes(postcode.toLowerCase()) ||
                (s.description && s.description.toLowerCase().includes(postcode.toLowerCase())) ||
                (s.region && s.region.some(r => r.toLowerCase() === postcode.toLowerCase()))
              ).slice(0, 3).map(service => (
                <div key={service.id} className="glass-card border border-white/20 rounded-xl p-4">
                  <h2 className="font-bold text-lg text-blue-300">{service.name}</h2>
                  <p className="text-white/80 mb-2">{service.description}</p>
                  <div className="flex flex-col gap-2">
                    <a href={`tel:${service.phone}`} className="flex items-center gap-2 bg-blue-500/30 hover:bg-blue-500/50 transition-colors rounded-lg p-3">
                      <i className="fas fa-phone-alt text-blue-300"></i>
                      <span className="text-white font-medium">{service.phone}</span>
                    </a>
                    {service.website && (
                      <a href={service.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-blue-500/30 hover:bg-blue-500/50 transition-colors rounded-lg p-3">
                        <i className="fas fa-external-link-alt text-blue-300"></i>
                        <span className="text-white">Visit Website</span>
                      </a>
                    )}
                  </div>
                  <div className="text-xs mt-3 text-blue-200/70">Region: {service.region.join(", ")}</div>
                </div>
              ))}
            </div>
          )}
          {/* Normal list under */}
          <div className="space-y-4 mt-4">
            {services.map((service) => (
              <div key={service.id} className="glass-card border border-white/20 rounded-xl p-4">
                <h2 className="font-bold text-lg text-blue-300">{service.name}</h2>
                <p className="text-white/80 mb-2">{service.description}</p>
                <div className="flex flex-col gap-2">
                  <a href={`tel:${service.phone}`} className="flex items-center gap-2 bg-blue-500/30 hover:bg-blue-500/50 transition-colors rounded-lg p-3">
                    <i className="fas fa-phone-alt text-blue-300"></i>
                    <span className="text-white font-medium">{service.phone}</span>
                  </a>
                  {service.website && (
                    <a href={service.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-blue-500/30 hover:bg-blue-500/50 transition-colors rounded-lg p-3">
                      <i className="fas fa-external-link-alt text-blue-300"></i>
                      <span className="text-white">Visit Website</span>
                    </a>
                  )}
                </div>
                <div className="text-xs mt-3 text-blue-200/70">Region: {service.region.join(", ")}</div>
              </div>
            ))}
            {services.length === 0 && (
              <div className="glass-card p-8 text-center">
                <div className="text-4xl mb-3">😕</div>
                <p className="text-white/80">No crisis services found for this region.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
